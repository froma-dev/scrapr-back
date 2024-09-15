# DNI Ready Pickup API (Backend)

## Overview

This backend API serves as the data source for
the [Honduran Consulate DNI Pickup Search application](https://github.com/froma-dev/scrapr-front). It provides a single
endpoint (`/scrape/pdf`) that scrapes the official PDF list from the Consulate website, extracts the relevant data, and
returns it in a structured JSON format. To optimize performance and reduce unnecessary network requests, the API
utilizes a caching mechanism to store the extracted data for a specified duration.

## Features

* **PDF Scraping:**  The API employs the `parse-pdf` library to extract data from the Consulate's PDF list.
* **Data Transformation:** The extracted data is transformed into a list of DNI ready entries, along with a title
  indicating the date or version of the list.
* **Caching:** The `node-cache` library is used to store the extracted data in memory for 15 days. This reduces the need
  to scrape the PDF repeatedly unless it's updated.
* **Single Endpoint:**  The API exposes a single endpoint (`/scrape/pdf`) for easy integration with the frontend
  application.

## API Endpoint

* **`/scrape/pdf`**

    * **Method:** `GET`
        * **Response:**
            * `Success (200 OK)`:
              ```json
              {
                "title": "listado_dni",
                "list": [
                  {"id": "d4fa887e-e9a8-4aac-8bc8-42beb4150eef","dni": "3456789*****","name": "JOHN DAVID SMITH"},
                  {"id": "11184e5e-6704-4b0f-91b4-3adeac5f33eb", "dni": "8765432*****", "name": "EMILY GRACE JOHNSON"}
                  // ... more entries
                ]
              }
              ```
            * `Error (500 Internal Server Error)`:  In case of any issues during scraping or data processing.

## Dependencies

* `express`: Web framework for Node.js
* `parse-pdf`: Library for extracting text and tables from PDF files
* `node-cache`: Simple in-memory caching for Node.js

## Important Notes

* **Fictitious Data (for now):** Currently, the application is populated with fictitious names for testing purposes.
  However, it has been successfully tested with real data. Due to the size of the real data is not feasible to provide
  it from the server itself.

## Disclaimer

This application is intended to provide a convenient way for Honduran citizens to check the availability of their DNI at
the Consulate in Madrid. While every effort is made to ensure the accuracy of the information, the developers cannot be
held responsible for any errors or discrepancies in the data. Please always refer to the official announcements from the
Consulate of Honduras for the most up-to-date information.

**Este sitio web no tiene ninguna afiliación con dicha entidad. Esta información puede estar sujeta a
cambios o actualizaciones por parte de la fuente oficial que puede encontrar en
[Consulado de Honduras en Madrid](https://www.consuladohondurasmadrid.es/) y en
[Facebook](https://www.facebook.com/consuladodehondurasenmadrid).**