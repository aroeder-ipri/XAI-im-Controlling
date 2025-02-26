import couchdb
import pandas as pd

def main():
    # Connect to CouchDB
    # Update the URL to match your CouchDB host and provide the correct credentials
    couch = couchdb.Server('http://admin:password@localhost:5984/')

    # Select the database
    db = couch['click_events']

    data_list = []
    # Fetch all documents in the database
    for doc_id in db:
        doc = db[doc_id]
        print("Document ID:", doc_id)
        print("Data:", doc)
        data_list.append(doc)

    # Convert the list of dictionaries to a DataFrame
    df = pd.DataFrame(data_list)

    # Saving the dataframe as csv
    df.to_csv('/home/ubuntu/XAI-im-Controlling/_test_database/click_events.csv', index=False)


if __name__ == "__main__":
    main()