import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from schedule_generator import ScheduleGenerator
    print("SUCCESS: ScheduleGenerator import successful")
except Exception as e:
    print(f"ERROR: {e}")

try:
    generator = ScheduleGenerator("2025", True)
    print("SUCCESS: ScheduleGenerator initialization successful")
except Exception as e:
    print(f"ERROR: {e}")
