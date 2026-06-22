import os

filepath = 'src/hooks/useAuthSync.test.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Fix super_admin test assertion
content = content.replace(
    "expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');",
    "expect(mockSetCurrentView).toHaveBeenCalledWith('adminDashboard');"
)

# Fix vet test assertion
# Since we replaced the first occurrence, the second one might still be 'dashboard' or it might have been replaced if they were identical.
# Let's do it carefully.
if "expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');" in content:
    content = content.replace(
        "expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');",
        "expect(mockSetCurrentView).toHaveBeenCalledWith('vetDashboard');"
    )

with open(filepath, 'w') as f:
    f.write(content)
print("Updated " + filepath)
