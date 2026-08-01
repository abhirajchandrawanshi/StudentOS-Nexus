import os
import subprocess
import sys

cmd = [r'c:\Users\Admin\Desktop\StudentOS-Nexus\.venv\Scripts\python.exe', '-m', 'pytest', r'c:\Users\Admin\Desktop\StudentOS-Nexus\backend\tests\test_company_mapper.py']
print('Running:', ' '.join(cmd))
result = subprocess.run(cmd, cwd=r'c:\Users\Admin\Desktop\StudentOS-Nexus\backend', check=False)
sys.exit(result.returncode)
