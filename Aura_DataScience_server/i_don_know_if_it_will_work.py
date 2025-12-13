import socketio
import uvicorn
import time
import os

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
import numpy as np


# graphing stuff
import matplotlib
matplotlib.use('Agg') # fix for server crash (no window)
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# setup server
fast_app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(sio, other_asgi_app=fast_app)

# config vars
TIME_LIMIT = 120 # seconds
THRESHOLDS = {
    'hr_rest': 120, 
    'hr_active': 180, 
    'spo2_min': 90, 
    'temp_max': 38.0
}

# simple memory storage
history = {} # stores full data points for the report
timers = {}  # stores alert start times

# --- report(visualization) ---

@fast_app.get("/get-report/{uid}")
def generate_report(uid: str):
    # check if we have data first
    if uid not in history or len(history[uid]) < 5:
        return JSONResponse({"msg": "Not enough data collected yet. Send data via socket first."})
    
   
    raw = history[uid]
    df = pd.DataFrame(raw)
    df['time'] = pd.to_datetime(df['time'])
    
    #  graph
    fname = make_plot(df, uid)
    return FileResponse(fname)

def make_plot(df, uid):
    #  setup
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # main line
    ax.plot(df['time'], df['hr'], color='#333', label='Heart Rate', linewidth=1.5)
    
    # gray zone for walking
    ax.fill_between(df['time'], 0, 250, where=(df['active']==1), 
                    color='gray', alpha=0.3, label='Walking')
    
    # red dots for danger (high hr + sitting)
    danger = df[(df['hr'] > 110) & (df['active'] == 0)]
    if not danger.empty:
        ax.scatter(danger['time'], danger['hr'], color='red', s=40, zorder=5, label='Anomaly')

    # customization
    ax.set_title(f"Session Report: {uid}")
    ax.set_ylabel("BPM")
    ax.set_ylim(40, 200)
    ax.grid(True, alpha=0.3)
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
    ax.legend()
    
    # summary box
    avg = int(df['hr'].mean())
    mx = int(df['hr'].max())
    txt = f"Avg: {avg}\nMax: {mx}"
    plt.text(0.02, 0.95, txt, transform=ax.transAxes, 
             bbox=dict(facecolor='white', alpha=0.9))
    
    #  file sving
    name = f"rep_{uid}.png"
    plt.savefig(name)
    plt.close()
    return name




#  socket 

@sio.on('vitals Stream')
async def on_message(sid, data):
    try:
        uid = data.get('user_id')
        ts = data.get('timestamp')
        vitals = data.get('data', {}) 
        
        hr = vitals.get('heartRate')
        spo2 = vitals.get('sp02')
        temp = vitals.get('temp')
        # default to 0 if missing
        active = vitals.get('Walking or Running', 0)
        
        # new added🥳
        steps = vitals.get('steps', 0)       
        gps = vitals.get('gps', {})          

        # basic validation
        if hr is None or spo2 is None: return

        # 1. Save to history (for the report)
        if uid not in history: history[uid] = []
        
        history[uid].append({
            'time': pd.Timestamp.now(), 
            'hr': hr,
            'active': active,
            'spo2': spo2
        })
        
        # keep list size manageable
        if len(history[uid]) > 5000:
            history[uid].pop(0)

        # 2. Check Alerts
        if uid not in timers:
            timers[uid] = {'hr_start': None, 'spo2_start': None}

        alert = None
        curr_t = time.time()

        # check spo2
        if spo2 < THRESHOLDS['spo2_min']:
            if timers[uid]['spo2_start'] is None:
                timers[uid]['spo2_start'] = curr_t
        else:
            timers[uid]['spo2_start'] = None # reset

        # trigger alert if time passed
        if timers[uid]['spo2_start'] and (curr_t - timers[uid]['spo2_start'] >= TIME_LIMIT):
            alert = make_alert(uid, ts, "spo2", spo2, "critical", "Low Oxygen", "Deep breaths needed")

        # check heart rate
        bad_hr = False
        if active == 1 and hr > THRESHOLDS['hr_active']: bad_hr = True
        elif active == 0 and hr > THRESHOLDS['hr_rest']: bad_hr = True

        if bad_hr:
            if timers[uid]['hr_start'] is None:
                timers[uid]['hr_start'] = curr_t
        else:
            timers[uid]['hr_start'] = None

        if timers[uid]['hr_start'] and (curr_t - timers[uid]['hr_start'] >= TIME_LIMIT):
            if not alert: # prioritize spo2
                alert = make_alert(uid, ts, "heart_rate", hr, "high", "High Heart Rate", "Rest immediately")

        # send response
        if alert:
            # reset timers so we dont spam
            timers[uid] = {'hr_start': None, 'spo2_start': None}
            await sio.emit('prediction Result', alert, to=sid)
            print(f"ALERT SENT -> {uid}: {alert['alert']['description']}")
        else:
            # log status
            pts = len(history[uid])
            status = "Walking" if active else "Resting"
            print(f"[{pts}] {uid} | {status} | HR: {hr} | SpO2: {spo2}")

    except Exception as e:
        print(f"error in loop: {e}")

def make_alert(uid, ts, param, val, level, desc, adv):
    return {
        "type": "Alert", 
        "user_id": uid, 
        "timestamp": ts,
        "alert": { 
            "parameter": param, 
            "value": val, 
            "unit": "bpm" if param == "heart_rate" else "%", 
            "level": level, 
            "description": desc, 
            "advice": adv 
        }
    }

if __name__ == '__main__':
    print("Server starting...")
    print("Use /get-report/USER_ID to see graph")
    uvicorn.run(app, host='0.0.0.0', port=5000)