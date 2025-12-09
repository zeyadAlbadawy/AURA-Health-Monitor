import socketio
import time

sio = socketio.Client()

@sio.on('prediction Result')
def on_alert(data):
    print("\nServer sent an alert🥳")
    print(data)

def start_test():
    try:
        sio.connect('http://localhost:5000')
        print("Connected to your Python Server!")
        
        print("Sending Healthy Data...")
        sio.emit('vitals Stream', {
            "user_id": "001", 
            "timestamp": "2025-10-19T14:30:00Z",
            "data": {"heartRate": 75, "sp02": 98, "temp": 37}
        })
        time.sleep(2)
        
        print("Sending Dangerous Data...")
        sio.emit('vitals Stream', {
            "user_id": "001", 
            "timestamp": "2025-10-19T14:30:05Z",
            "data": {"heartRate": 140, "sp02": 95, "temp": 37}
        })
        
        sio.wait() # Keep listening for the reply
    except Exception as e:
        print("Connection failed 🤨")
        print(e)

start_test()