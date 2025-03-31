import tkinter as tk
from PIL import Image, ImageTk

class ImageLabel(tk.Label):
    def __init__(self, master, image_path, mode="fit", *args, **kwargs):
        """
        mode: 
        - "fit" -> Keeps aspect ratio, fits inside label
        - "cover" -> Covers label fully, cropping excess
        """
        super().__init__(master, *args, **kwargs)
        self.parent = master  # Store parent reference
        self.image_path = image_path
        self.mode = mode
        self.original_image = Image.open(image_path)
        self.photo = None
        self.resize_job = None  # Debounce job reference

        self.force_resize()  # Initial resize
        self.after(100, self.init_events)  # Delay event binding slightly

    def init_events(self):
        self.parent.bind("<Configure>", self.on_resize)  # Bind resize to parent

    def on_resize(self, event=None):
        """Debounce resizing to prevent rapid execution."""
        if self.resize_job:
            self.after_cancel(self.resize_job)
        self.resize_job = self.after(50, self.force_resize)  # Debounce

    def force_resize(self):
        """Resize image using actual widget size."""
        width = self.winfo_width()
        height = self.winfo_height()
        if width < 5 or height < 5:
            return

        aspect_ratio = self.original_image.width / self.original_image.height

        if self.mode == "fit":
            if width / height > aspect_ratio:
                new_width = int(height * aspect_ratio)
                new_height = height
            else:
                new_width = width
                new_height = int(width / aspect_ratio)
            resized = self.original_image.resize((new_width, new_height), Image.LANCZOS)

        elif self.mode == "cover":
            if width / height > aspect_ratio:
                new_width = width
                new_height = int(width / aspect_ratio)
            else:
                new_width = int(height * aspect_ratio)
                new_height = height
            resized = self.original_image.resize((new_width, new_height), Image.LANCZOS)

            # Crop excess
            left = (new_width - width) // 2
            top = (new_height - height) // 2
            right = left + width
            bottom = top + height
            resized = resized.crop((left, top, right, bottom))

        # Update image
        self.photo = ImageTk.PhotoImage(resized)
        self.config(image=self.photo)