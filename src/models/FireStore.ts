import {
  CollectionReference,
  DocumentData,
  Query,
  WhereFilterOp,
} from '@firebase/firestore-types';

type Where<T> = [keyof T, WhereFilterOp, any];

class FireStore<T extends DocumentData> {
  collection: CollectionReference<DocumentData>;

  constructor(collection: CollectionReference<DocumentData>) {
    this.collection = collection;
  }

  async add(id: string, document: T): Promise<void>;
  async add(document: T): Promise<void>;

  async add(arg1: any, arg2?: any): Promise<void> {
    if (arg2 !== undefined) {
      const id: string = arg1;
      const document: T = arg2;
      this.collection.doc(id).set(document);
    } else {
      const document: T = arg1;
      this.collection.add(document);
    }
  }

  async remove(id: string): Promise<void> {
    this.collection.doc(id).delete();
  }

  async get(id: string): Promise<T | undefined> {
    return this.collection
      .doc(id)
      .get()
      .then((doc) => (doc.exists ? (doc.data() as T) : undefined));
  }

  async queryAll(queries: Where<T>[]): Promise<T[]> {
    const queriedCollection = queries.reduce(
      (collections: Query<DocumentData>, query) => {
        const [field, opStr, value] = query;
        return collections.where(field as string, opStr, value);
      },
      this.collection,
    );

    return queriedCollection
      .get()
      .then((querySnapshot) =>
        querySnapshot.docs.map((doc) => doc.data() as T),
      );
  }
}

export default FireStore;
