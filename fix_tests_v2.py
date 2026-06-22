import os

def replace_in_file(filepath, old, new):
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        if old in content:
            with open(filepath, 'w') as f:
                f.write(content.replace(old, new))
            print(f"Updated {filepath}")
        else:
            print(f"Pattern not found in {filepath}")

# Fix tailwind.contrast.test.ts path
replace_in_file('src/__tests__/tailwind.contrast.test.ts',
                "path.resolve(__dirname, 'index.css')",
                "path.resolve(process.cwd(), 'src/index.css')")
