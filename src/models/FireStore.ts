import {
  CollectionReference,
  DocumentData,
  Query,
  WhereFilterOp,
} from '@firebase/firestore-types';
import { randomHash } from '../utils';

type Where<T> = [keyof T, WhereFilterOp, any];

class FireStore<T extends DocumentData> {
  collection: CollectionReference<DocumentData>;

  constructor(collection: CollectionReference<DocumentData>) {
    this.collection = collection;
  }

  async generateAutoId(): Promise<string> {
    let doc, candidateId;
    do {
      candidateId = await randomHash();
      doc = await this.get(candidateId);
    } while (!doc);
    return candidateId;
  }

  async add(id: string, document: T): Promise<void> {
    this.collection.doc(id).set(document);
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
