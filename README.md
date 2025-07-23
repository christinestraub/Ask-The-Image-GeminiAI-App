Gemini AI App (Image to Text)
=========================

This repository contains the code for an image annotation app that uses the Gemini AI model to generate annotations for images. The app allows users to upload images and input a natural language description of the objects or features they want to get description from the image. The model then generates the corresponding annotations and overlays them on the image.

Getting Started
---------------

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to install the software and how to install them

-   Python 3.9
-   pip (Python package manager)
-   virtualenv (Python virtual environment manager)

### Installing

A step by step series of examples that tell you how to get a development environment running

1. Clone the repository to your local machine

```
git clone https://github.com/christinestraub/Ask-The-Image-GeminiAI-App.git
```

2. Create a virtual environment and activate it

```
virtualenv venv
source venv/bin/activate
```

3. Install the required packages

```
pip install -r requirements.txt
```

4. Copy the Gemini AI AAPI KEY from Google AI Studio.

5. Run the app

```
python app.py
```

Using the App
-------------

The app will prompt you to upload an image and enter a natural language description of the objects or features you want to annotate in the image. For example, you might upload a picture of a kitchen and enter "Show me the locations and labels of all appliances in the image." The model will then generate the corresponding annotations and display them on the image.

Built With
----------

-   [Python](https://www.python.org/) - Programming language
-   [Streamlit](https://streamlit.com/) - Web framework
-   [Gemini AI Model](https://huggingface.co/babelscape/gemini) - AI model for generating image annotations
