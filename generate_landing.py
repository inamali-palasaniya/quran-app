from PIL import Image

# Create a simple solid color image (Teal)
img = Image.new('RGB', (800, 1200), color = (0, 128, 128))
img.save('mobile/assets/landing.png')
print("Created simple landing.png")
