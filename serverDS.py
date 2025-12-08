import socketio
import uvicorn
import json

# init the server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(sio)

# thresholds
thresholds = {
    'hr_rest_high': 120,    
    'hr_active_high': 180, 
    'spo2_critical': 90,    
    'temp_fever': 38.0      
}

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

       # what i care about  
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


    #                                                 --- alert strategy ---
    
    alert_payload = None
    
    # 1. check spo2 (Blood Oxygen) ...(very important)


    if sp02 < thresholds['spo2_critical']:
        alert_payload = create_alert(
            user_id, timestamp, 
            param="spo2", 
            value=sp02, 
            unit="%", 
            level="critical", 
            desc='Low blood oxygen levels detected', 
            adv="take a deep breath and sit up straight. If you feel dizzy, call for help"
        )

    # 2. check heart rate ( active + above threshold )

    elif is_active == 1 and heart_rate > thresholds['hr_active_high']:
        alert_payload = create_alert(
            user_id, timestamp,
            param="heart_rate", 
            value=heart_rate, 
            unit="bpm",
            level="high",
            desc="Extremely high heart rate during activity",
            adv= "whoa, slow down! take a break until your heart beat settles"
        )
            
    # 3. check heart rate (rest + above threshold)
    
    elif is_active == 0 and heart_rate > thresholds['hr_rest_high']:
        alert_payload = create_alert(
            user_id, timestamp,
            param="heart_rate", 
            value=heart_rate, 
            unit="bpm",
            level="high",
            desc="heart is racing while resting",
            adv="You seem stressed or tired. close your eyes and relax for a moment."
        )

    # 4. check temp

    elif (temp is not None) and (temp > thresholds['temp_fever']):
        alert_payload = create_alert(
            user_id, timestamp,
            param="temperature", 
            value=temp, 
            unit="c",
            level="warning",
            desc="ur body temperature is running hot",
            adv="You might be getting sick. Drink water and rest."
        )

    # send result
    if alert_payload:
        print(f"sending alert: {alert_payload['alert']['description']}")
        await sio.emit('prediction Result', alert_payload, to=sid)
    else:
        status = "active" if is_active else "resting"
        print(f"status: {status} | hr: {heart_rate} | spo2: {sp02}%")

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
    print("starting data science server...")
    uvicorn.run(app, host='0.0.0.0', port=5000)