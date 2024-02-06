import streamlit as st
import os
from PIL import Image
import google.generativeai as generativeai
from dotenv import load_dotenv

load_dotenv()

generativeai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_gemini_response(input, image):
    model = generativeai.GenerativeModel('gemini-pro-vision')
    if input != "":
        response = model.generate_content([input, image])
    else:
        response = model.generate_content(image)
    return response.text


st.set_page_config(page_title="Gemini Pro Vision App", page_icon="🦄", layout="wide")

st.header("'Ask The Image 🖼️❓' Gemini Pro Vision")
input = st.text_input("Input prompt: ", key="input")

uploaded_file = st.file_uploader("Upload an image... ", type=["png", "jpg", "jpeg"])
image= ""
if uploaded_file is not None:
    image = Image.open(uploaded_file)
    st.image(image, caption='Uploaded Image.', use_column_width=True)

submit = st.button("Tell me more!")
if submit:
    if uploaded_file is not None:
        response = get_gemini_response(input, image)
        st.write(response)
    else:
        st.write("Please upload an image.")
