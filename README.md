# PLUM-Assignment# AI-Powered Medical Bill Parser

A smart, automated service designed to read financial information from medical bills and receipts, reducing manual effort and improving data accuracy.

---


## 📖 Table of Contents
* [Key Features](#-key-features)
* [How It Works: A Simple Flow](#-how-it-works-a-simple-flow)
* [Technology Stack](#-technology-stack)
* [API Reference](#-api-reference)
* [Getting Started (For Developers)](#-getting-started-for-developers)
* [Future Improvements](#-future-improvements)

---


## 🚀 Key Features

* **📄 Digital Text Extraction (OCR):** The service uses Optical Character Recognition (OCR) to read and convert the text from an image into digital, machine-readable text. It can handle scanned documents, photos, and even slightly crumpled or noisy images.
* **🧠 Smart Data Normalization:** OCR isn't always perfect. It might mistake an `l` for a `1` or an `O` for a `0`. Our service automatically corrects these common errors, ensuring the final numeric values are accurate.
* **💡 Contextual Classification:** The service doesn't just find numbers—it understands what they mean. By analyzing the surrounding text, it correctly identifies which number is the **`total_bill`**, which is a **`tax`**, and which is a **`subtotal`**.
* **📦 Structured Digital Output:** The final, extracted information is provided in a clean, universally accepted format called **JSON**. This makes it incredibly easy for other software systems to use this data immediately.

---


## ⚙️ How It Works: A Simple Flow

The process can be broken down into four simple, automated steps:

1.  **Upload Image:** A user sends a picture of a medical bill to our service's secure digital endpoint.
2.  **Read the Document:** The AI reads all the text on the bill, just like a person would.
3.  **Analyze & Understand:** The service intelligently scans the text to find financial keywords (like "Gross Amount" or "SGST"). It then correctly associates them with their values, cleaning up any OCR errors along the way.
4.  **Generate a Report:** Finally, it generates a perfect, structured digital report (JSON format) containing all the classified amounts, their values, and the currency.

---


## 🛠️ Technology Stack

This project was built using modern and reliable technologies:
* **Node.js:** The core environment that runs the server-side JavaScript code.
* **Express.js:** A web framework that helps build the API and manage requests.
* **Tesseract.js:** A powerful open-source OCR engine that performs the text extraction from images.

---


## 🔗 API Reference

This section details the API endpoints available in this service.

### `POST /api/extract`

This is the core endpoint of the service. It accepts an image file of a medical bill, processes it, and returns the extracted financial data in a structured JSON format.

**Request Body**
* **Type:** `multipart/form-data`
* **Field:**
    * `billImage` (file): The image of the bill/receipt (e.g., `.png`, `.jpg`). **This field is required.**

**Success Response (Code `200 OK`)**
* **Content:** A JSON object containing the extracted financial details and provenance.
* **Example:**
    ```json
    {
        "currency": "INR",
        "amounts": [
            {
                "type": "subtotal",
                "value": 819.7,
                "source": "text: 'Total net 819.70 INR'"
            },
            {
                "type": "tax",
                "value": 20.49,
                "source": "text: 'Total SGST/UTGST Amount 20.49 INR'"
            },
            {
                "type": "tax",
                "value": 20.49,
                "source": "text: 'Total CGST Amount 20.49 INR'"
            },
            {
                "type": "total_bill",
                "value": 860.68,
                "source": "text: 'Gross Amount 860.68 INR'"
            }
        ],
        "status": "ok"
    }
    ```

**Error Responses (Code `400 Bad Request`)**
* **Content:** A JSON object explaining the nature of the error.
* **Example (No File Uploaded):**
    ```json
    {
        "status": "error",
        "reason": "No image file provided. Please upload a file with the key 'billImage'."
    }
    ```
* **Example (Image Unreadable):**
    ```json
    {
        "status": "no_amounts_found",
        "reason": "Document too noisy or empty. OCR failed to produce text."
    }
    ```

---


## 👨‍💻 Getting Started (For Developers)

Instructions on how to set up and run the project locally.

### Prerequisites
You must have [Node.js](https://nodejs.org/) (version 16 or newer) installed on your machine.

### Steps to Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/Harsh-Agrawal96/PLUM-Assignment.git
   ```

2. Install backend dependencies:
   ```bash
   cd PLUM-Assignment
   npm install
   ```

3. Set up backend environment variables:
   Create a `.env` file in the server directory and add the variable values which are present in .env.example file like below:
   ```env
   PORT=3000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

5. You can test the service using a tool like Postman or the command-line tool curl.
   Send a POST request with your image file to the /api/extract endpoint.
   ```bash
   # Make sure you have a bill image (e.g., bill.png) in the same directory
   curl -X POST http://localhost:3000/api/extract \
        -F "billImage=@bill.png"
   ```

6. The server will respond with a structured JSON object of expenses.

---


## 🔮 Future Improvements

This project provides a strong foundation for a powerful extraction tool. Here are some simple, high-impact features that could be added next:

* **📄 PDF Document Support:**
    Allow users to upload single-page `.pdf` files in addition to images. This would greatly increase the service's utility, as many invoices are shared in this format.

* **🕵️‍♂️ Extract More Data Fields:**
    Expand the classification logic to identify and extract other important details from the bill, such as:
    * `Invoice Number`
    * `Invoice Date`
    * `GSTIN` / `HSN Code`

* **🔐 Basic API Key Authentication:**
    Add a simple security layer requiring a valid API key to be sent in the request headers. This would prevent unauthorized use of the service.

* **📊 Basic Usage Logging:**
    Implement logging to a file to keep a simple record of each request, including a timestamp, the result (`success` or `error`), and how long the processing took. This would be valuable for monitoring and debugging.