import re

# Read the file
with open('app/models/user_models.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all regex= with pattern=
content = re.sub(r'regex=', 'pattern=', content)

# Write back to file
with open('app/models/user_models.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fixed all regex= to pattern= for Pydantic v2 compatibility')