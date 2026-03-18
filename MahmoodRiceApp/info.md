# MahmoodController API Documentation



This controller exposes endpoints for verifying product authenticity using QR code and SEALVector (SV) analysis.



---



## Base Route



```

/

```



---



## `GET /`



### Description



Health check endpoint to verify that the API is up and running.



### Response



- **200 OK**

  Returns a plain text message:

  ```

  ATT api is up and running

  ```



---



## `POST /`



### Description



Uploads an image (with optional QR code) to validate product authenticity by reading and verifying QR code and SEALVector data.



### Headers



| Header             | Required | Description                            |

|--------------------|----------|----------------------------------------|

| `X-Correlation-ID` | ✅        | Unique identifier for request tracking |

| `Secret`           | ✅        | Authentication secret configured on the server |



### Request Format



Supports two content types:

- `multipart/form-data` with fields:

    - `Qr` (optional): Raw QR code string

    - `Image` (required): PNG/JPEG image file

- `application/json` with properties:

    - `Qr` (optional): Raw QR code string

    - `Image` (required): Base64-encoded image string



### Response



Returns a JSON object with the result of the verification.



#### Example Response



```json

{

  "Message": "Verified | Unverified | TryAgainQr | TryAgainSv",

  "Code": 1 | 2 | 3 | 4,

  "Qr": "optional decoded QR content"

}

```



#### Response Codes



| Code | Name         | Description                                                                 |

|------|--------------|-----------------------------------------------------------------------------|

| 1    | Verified     | QR and SV are both decoded and match the product                            |

| 2    | Unverified   | QR is unknown or SV mismatch/failure                                        |

| 3    | TryAgainQr   | QR code was not detected or unreadable                                      |

| 4    | TryAgainSv   | SV was not decoded; try again with better image                             |



---



## Business Logic Summary



### If QR code is present:

- Try to decrypt and extract product details.

- Check if the QR matches known product data.

- If SV is also successfully decoded:

    - If both match => **Verified**

    - If mismatch => **Unverified**

- If SV decoding fails:

    - On first attempt (no qr code value in request) => **TryAgainSv**

    - Otherwise => **Unverified**



### If QR code is missing or not decoded:

- => **TryAgainQr**



---



## Internal Types



### `ControlRequest`



| Property | Type   | Description                      |

|----------|--------|----------------------------------|

| `Qr`     | string | QR code string (optional)        |

| `bmp`    | Bitmap | Uploaded image for analysis      |



---



### `ControlResponse`



| Property | Type          | Description                             |

|----------|---------------|-----------------------------------------|

| `Message`| string        | Human-readable message (enum name)      |

| `Code`   | `ResponseType`| Enum indicating the result              |

| `Qr`     | string?       | Decoded QR code string, if available    |



---



### `ResponseType` Enum



| Name        | Value | Description                                  |

|-------------|--------|----------------------------------------------|

| Verified    | 1     | Product successfully verified                 |

| Unverified  | 2     | Product could not be verified or mismatched  |

| TryAgainQr  | 3     | QR code unreadable or missing                 |

| TryAgainSv  | 4     | SEALVector unreadable on first try           |



---



## Error Handling



| Status Code         | Reason                                      |

|---------------------|---------------------------------------------|

| 400 Bad Request     | Missing image, QR, or required data         |

| 403 Forbidden       | Secret header is missing or incorrect       |

| 500 Internal Server Error | Missing correlation ID or server errors |



---



## Notes



- Bitmap images are saved to the folder defined in the config key `logImagesFolder`.

- Images can be submitted either through form-data or as a base64 JSON payload.

- QR and SV extraction are handled concurrently using tasks.

- Log messages include the correlation ID to trace flow in logs.