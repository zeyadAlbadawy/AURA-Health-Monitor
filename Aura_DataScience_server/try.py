import socketio
import uvicorn
import json
import time  
from fastapi import FastAPI


fast_app = FastAPI()

# 2. init the socketio server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

app = socketio.ASGIApp(sio, other_asgi_app=fast_app)


# time module
time_limit_sec = 120

# thresholds
thresholds = {
    'hr_rest_high': 120,    
    'hr_active_high': 180, 
    'spo2_critical': 90,    
    'temp_fever': 38.0      
}

#  start time of the problem
# Structure: {
    #  "user_id": { 
        # "hr_start": None, 
        # "spo2_start": None, 
        # "temp_start": None
    #             } 
#            }
user_memory = {}

@fast_app.get("/")
def home():
    return {"Aura ds server (time-module added (it makes it totlal miss by the way 😔))"}

@sio.event
async def connect(sid, environ):
    print(f"client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"client {sid} disconnected")

@sio.on('vitals Stream')
async def handle_vitals(sid, data):
    try:
        user_id = data.get('user_id')
        timestamp = data.get('timestamp')
        vitals = data.get('data', {}) 
        
        heart_rate = vitals.get('heartRate')
        sp02 = vitals.get('sp02')
        temp = vitals.get('temp')
        is_active = vitals.get('Walking or Running', 0)

    except Exception as e:
        print(f"error parsing data: {e}")
        return

    # cleaning step
    if heart_rate is None or heart_rate <= 0 or heart_rate > 250:
        return 
    if sp02 is None or sp02 <= 0:
        return
  

# new or old user ???

    if user_id not in user_memory:
        user_memory[user_id] = {'hr_start': None, 'spo2_start': None, 'temp_start': None}

    alert_payload = None
    current_time = time.time() #  current server time in seconds


    if sp02 < thresholds['spo2_critical']:
        if user_memory[user_id]['spo2_start'] is None:
            user_memory[user_id]['spo2_start'] = current_time
    else:
        user_memory[user_id]['spo2_start'] = None

    start_t = user_memory[user_id]['spo2_start']
    if start_t is not None and (current_time - start_t >= time_limit_sec):
        alert_payload = create_alert(
            user_id, timestamp, 
            param="spo2", value=sp02, unit="%", level="critical", 
            desc='low blood oxygen levels detected for 2 minutes', 
            adv="take a deep breath and sit up straight. if you feel dizzy, call for help"
        )


    hr_is_bad = False
    
    if is_active == 1:
        if heart_rate > thresholds['hr_active_high']:
            hr_is_bad = True
            desc_text = "extremely high heart rate during activity for 2 minutes "
            adv_text = "whoa, slow down! take a break until your heart beat settles"
    else: 
        if heart_rate > thresholds['hr_rest_high']:
            hr_is_bad = True
            desc_text = "heart is racing while resting for 2 minutes"
            adv_text = "you seem stressed or tired. close your eyes and relax for a moment."

    # timer
    if hr_is_bad:
        if user_memory[user_id]['hr_start'] is None:
            user_memory[user_id]['hr_start'] = current_time
    else:
        user_memory[user_id]['hr_start'] = None

    hr_start = user_memory[user_id]['hr_start']
    # Only alert if duration passed and  don  have an SpO2 alert
    if hr_start is not None and (current_time - hr_start >= time_limit_sec):
        if not alert_payload:
            alert_payload = create_alert(
                user_id, timestamp,
                param="heart_rate", value=heart_rate, unit="bpm", level="high",
                desc=desc_text,
                adv=adv_text
            )


    if (temp is not None) and (temp > thresholds['temp_fever']):
        if user_memory[user_id]['temp_start'] is None:
            user_memory[user_id]['temp_start'] = current_time
    else:
        user_memory[user_id]['temp_start'] = None

    temp_start = user_memory[user_id]['temp_start']
    if temp_start is not None and (current_time - temp_start >= time_limit_sec):
        if not alert_payload:
            alert_payload = create_alert(
                user_id, timestamp,
                param="temperature", value=temp, unit="c", level="warning",
                desc="ur body temperature is running hot for 2 minutes",
                adv="you might be getting sick. drink water and rest."
            )


    if alert_payload:
        reset_timers(user_id) 
        print(f"sending alert: {alert_payload['alert']['description']}")
        await sio.emit('prediction Result', alert_payload, to=sid)
    else:
        status = "active" if is_active else "resting"
        
        #  how long  in danger zone???
        duration = 0
        if user_memory[user_id]['hr_start'] is not None:
            duration = int(current_time - user_memory[user_id]['hr_start'])
            
        print(f"status: {status} | hr: {heart_rate} (danger for: {duration}s) | spo2: {sp02}%")

def reset_timers(uid):
    user_memory[uid] = {'hr_start': None, 'spo2_start': None, 'temp_start': None}

def create_alert(uid, time, param, value, unit, level, desc, adv):
    return {
        "type": "Alert",
        "user_id": uid,
        "timestamp": time,
        "alert": {
            "parameter": param,
            "value": value,
            "unit": unit,
            "level": level,
            "description": desc,
            "advice": adv
        }
    }

if __name__ == '__main__':
    print(f"starting aura server... (alert after {time_limit_sec} seconds)")
    uvicorn.run(app, host='0.0.0.0', port=5000)