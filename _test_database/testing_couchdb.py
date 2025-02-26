import couchdb
import pandas as pd

def main():
    # Connect to CouchDB
    # Update the URL to match your CouchDB host and provide the correct credentials
    couch = couchdb.Server('http://admin:password@localhost:5984/')

    # Select the database
    db = couch['click_events']

    # Fetch all documents in the database
    for doc_id in db:
        doc = db[doc_id]
        print("Document ID:", doc_id)
        print("Data:", doc)


if __name__ == "__main__":
    main()