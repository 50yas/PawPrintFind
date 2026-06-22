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

# Fix Manifest.test.ts paths
replace_in_file('src/__tests__/Manifest.test.ts',
                "path.resolve(__dirname, 'vite.config.ts')",
                "path.resolve(process.cwd(), 'vite.config.ts')")
replace_in_file('src/__tests__/Manifest.test.ts',
                "path.resolve(__dirname, 'index.html')",
                "path.resolve(process.cwd(), 'index.html')")

# Fix css.variables.test.ts path
replace_in_file('src/__tests__/css.variables.test.ts',
                "path.resolve(process.cwd(), 'index.css')",
                "path.resolve(process.cwd(), 'src/index.css')")

# Fix tailwind.contrast.test.ts path
replace_in_file('src/__tests__/tailwind.contrast.test.ts',
                "path.resolve(process.cwd(), 'src/__tests__/index.css')",
                "path.resolve(process.cwd(), 'src/index.css')")
