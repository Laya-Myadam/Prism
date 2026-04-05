from pypdf import PdfReader
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch
import io


# Load BLIP model once at module level (cached in memory)
_blip_processor = None
_blip_model = None


def _load_blip():
    global _blip_processor, _blip_model
    if _blip_processor is None:
        _blip_processor = BlipProcessor.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        _blip_model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        _blip_model.eval()


def describe_image(pil_image: Image.Image) -> str:
    """
    Takes a PIL image and returns a plain English description
    using the BLIP image captioning model.
    """
    _load_blip()

    # Convert to RGB (some PDFs embed RGBA or palette images)
    pil_image = pil_image.convert("RGB")

    inputs = _blip_processor(pil_image, return_tensors="pt")
    with torch.no_grad():
        output = _blip_model.generate(
            **inputs,
            max_new_tokens=80,
            num_beams=4,
        )
    caption = _blip_processor.decode(output[0], skip_special_tokens=True)
    return caption.strip()


def extract_images_from_pdf(pdf_path: str) -> list[dict]:
    """
    Extracts all embedded images from a PDF.
    Returns a list of dicts: {page_num, image_index, description}

    Each image is described by BLIP and stored as text so it
    can be embedded into the FAISS vectorstore alongside regular text.
    """
    reader = PdfReader(pdf_path)
    image_descriptions = []

    for page_num, page in enumerate(reader.pages, start=1):
        images_on_page = []

        # pypdf stores images in page resources
        if "/Resources" not in page:
            continue

        resources = page["/Resources"]
        if "/XObject" not in resources:
            continue

        xobject = resources["/XObject"].get_object()
        for name, obj in xobject.items():
            obj = obj.get_object()
            if obj.get("/Subtype") == "/Image":
                images_on_page.append(obj)

        for idx, img_obj in enumerate(images_on_page):
            try:
                # Get raw image bytes
                data = img_obj.get_data()
                color_space = img_obj.get("/ColorSpace", "/DeviceRGB")

                # Determine PIL mode
                if "/DeviceGray" in str(color_space):
                    mode = "L"
                elif "/DeviceCMYK" in str(color_space):
                    mode = "CMYK"
                else:
                    mode = "RGB"

                width = int(img_obj["/Width"])
                height = int(img_obj["/Height"])

                # Skip tiny images (icons, decorations, bullets < 50x50)
                if width < 50 or height < 50:
                    continue

                # Try to open as raw pixel data first, fallback to PIL auto-detect
                try:
                    pil_img = Image.frombytes(mode, (width, height), data)
                except Exception:
                    pil_img = Image.open(io.BytesIO(data))

                description = describe_image(pil_img)

                image_descriptions.append({
                    "page_num": page_num,
                    "image_index": idx + 1,
                    "description": description,
                    # Format as readable text for embedding
                    "text": f"[Image on page {page_num}, image {idx+1}]: {description}",
                })

            except Exception:
                # Skip unreadable images silently
                continue

    return image_descriptions