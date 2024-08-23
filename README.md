UPC Barcode Manager

Web application built with Node.js, Express, Pug, and SQLite. It allows users to upload a catalog of products, search for product information, and manage a simple database of product details.

## Features

- **Upload Catalog**: Upload a spreadsheet containing product details.
- **Search**: Search for products by model name (style) and size.
- **Printable Labels**: Generate and print product labels with UPC codes.
- **Navigation**: Easy navigation between the Home, Upload, and Search pages.

## Project Structure
├── app.js                # Main application file
├── package.json          # Project dependencies and scripts
├── public/               # Static files (CSS, images)
│   └── stylesheets/
│       └── style.css     # Custom styles for the app
├── routes/
│   ├── catalog.js        # Catalog-related routes (upload, lookup)
│   └── index.js          # Home route
├── views/                # Pug templates
│   ├── layout.pug        # Common layout template
│   ├── upload.pug        # Upload page template
│   ├── lookup.pug        # Lookup/Search page template
│   └── index.pug         # Home page template
└── database/
    └── catalog.db        # SQLite database


## Usage
Upload a Catalog
Navigate to the "Upload" page.
Upload a spreadsheet in the following format:
Column 1: Model Name (Style)
Column 2: UPC
Column 3: Color Description
Column 4: Size
Column 5: Style-Color-Size Combined
The uploaded data will be stored in the SQLite database.

Search for a Product
Navigate to the "Search" page.
Enter the model name (style) and size of the product.
Optionally, filter by color.
The results will show the product details, including UPC, style, color, and size.

Print Product Labels
After searching for a product, you can generate and print a label with the UPC code.
Choose the label size and click "Print Label."
Database Structure
The SQLite database (catalog.db) contains a single table catalog with the following columns:

style: Model name of the product
upc: Universal Product Code
clr_desc: Color description of the product
size: Size of the product
style_col_size: Combined identifier for style, color, and size








    
