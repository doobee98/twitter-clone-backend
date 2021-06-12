import {
  CollectionReference,
  DocumentData,
  Query,
} from '@firebase/firestore-types';
import { sanitizeUndefined } from '../utils';

type CollectionFilterFunc<T> = (collection: CollectionReference<T>) => Query<T>;

class FireStore<T extends DocumentData> {
  collection: CollectionReference<DocumentData>;

  constructor(collection: CollectionReference<DocumentData>) {
    this.collection = collection;
  }

  async generateAutoId(): Promise<string> {
    const ref = this.collection.doc();
    return ref.id;
  }

  async add(id: string, document: T): Promise<void> {
    this.collection.doc(id).set(sanitizeUndefined(document));
  }

  async update(id: string, doc_fields: Partial<T>): Promise<void> {
    this.collection.doc(id).update(doc_fields);
  }

  async remove(id: string): Promise<void> {
    this.collection.doc(id).delete();
  }

  async has(id: string): Promise<boolean> {
    return this.collection
      .doc(id)
      .get()
      .then((doc) => doc.exists);
  }

  async get(id: string): Promise<T | undefined> {
    return this.collection
      .doc(id)
      .get()
      .then((doc) => (doc.exists ? (doc.data() as T) : undefined));
  }

  async queryAll(filterFunc: CollectionFilterFunc<T>): Promise<T[]> {
    return filterFunc(this.collection as CollectionReference<T>)
      .get()
      .then((querySnapshot) =>
        querySnapshot.docs.map((doc) => doc.data() as T),
      );
  }

  async queryAllId(filterFunc: CollectionFilterFunc<T>): Promise<string[]> {
    return filterFunc(this.collection as CollectionReference<T>)
      .get()
      .then((querySnapshot) => querySnapshot.docs.map((doc) => doc.id));
  }
}

export default FireStore;
