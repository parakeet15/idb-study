'use strict';

const title = document.getElementById('title');
const body = document.getElementById('body');
const displayArea = document.getElementById('display-area');
const saveButton = document.getElementById('save');

saveButton.addEventListener('click', save, true);

var DATABASE = null;

const DATABASE_NAME = 'memo';
const STORE_NAME = 'memoes';

window.onload = () => {
  if (!window.indexedDB) {
    window.alert('IndexedDB はサポートされていません');
    return;
  }

  const openRequest = indexedDB.open(DATABASE_NAME, 1);

  openRequest.onupgradeneeded = event => {
    DATABASE = event.target.result;
    DATABASE.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
  }

  openRequest.onsuccess = event => {
    DATABASE = event.target.result;
    console.info('データベースへの接続に成功しました');

    const transaction = DATABASE.transaction(STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);

    const cursorRequest = objectStore.openCursor(null, 'next');
    cursorRequest.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor === null) return;
      output(cursor.value.id);
      cursor.advance(1);
    }
  }

  openRequest.onerror = event => {
    alert('データベースへの接続に失敗しました');
    console.error('データベースへの接続に失敗しました');
  }
}

/**
 * データベースにデータを追加する
 */
function save() {
  if (title.value.length === 0 || body.value.length === 0) {
    alert('タイトルまたはテキストが入力されていません');
    title.value = null;
    body.value = null;
    return;
  }

  const data = {
    title: title.value,
    body: body.value,
    writeDate: new Date().toLocaleString()
  };

  title.value = null;
  body.value = null;

  const transaction = DATABASE.transaction(STORE_NAME, 'readwrite');
  const objectStore = transaction.objectStore(STORE_NAME);

  let id = null;

  const addRequest = objectStore.add(data);
  addRequest.onsuccess = event => {
    id = event.target.result;
    output(id);
  }

  transaction.oncomplete = () => {
    console.info('データの保存処理が正常に完了しました', `ID: ${id}`);
  }
}

/**
 * 引数に指定した ID を持つレコードを削除する
 * @param {string | number} id keyPath
 */
function del(id) {
  const transaction = DATABASE.transaction(STORE_NAME, 'readwrite');
  const objectStore = transaction.objectStore(STORE_NAME);
  const deleteRequest = objectStore.delete(id);

  deleteRequest.onsuccess = event => {
    const item = document.getElementById(id);
    item ? item.remove() : console.warn(`ID: ${id} に一致する要素はありません`);
  }

  transaction.oncomplete = () => {
    console.info('データの削除処理が正常に完了しました', `ID: ${id}`);
  }
}

/**
 * 引数に指定した ID を持つレコードをリストに追加する
 * @param {string | number} id keyPath
 */
function output(id) {
  const transaction = DATABASE.transaction(STORE_NAME, 'readonly');
  const objectStore = transaction.objectStore(STORE_NAME);
  const getRequest = objectStore.get(id);

  getRequest.onsuccess = event => {
    const data = event.target.result;

    const card = document.createElement('div');
    const cardHeader = document.createElement('div');
    const cardBody = document.createElement('div');
    const cardFooter = document.createElement('div');
    const cardTitle = document.createElement('h5');
    const cardText = document.createElement('p');
    const deleteButton = document.createElement('button');

    card.id = id;
    card.classList.add('card', 'my-3');
    cardHeader.classList.add('card-header');
    cardBody.classList.add('card-body');
    cardFooter.classList.add('card-footer', 'text-muted');
    cardTitle.classList.add('card-title');
    cardText.classList.add('card-text');
    deleteButton.classList.add('btn', 'btn-danger', 'float-right');

    deleteButton.setAttribute('onclick', `del(${id})`);

    cardHeader.innerText = `ID: ${id}`;
    cardTitle.innerText = data.title;
    cardText.innerText = data.body;
    cardFooter.innerText = data.writeDate;
    deleteButton.innerText = '削除';

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardFooter.appendChild(deleteButton);

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);
    displayArea.insertBefore(card, displayArea.firstChild);
  }

  transaction.oncomplete = () => {
    console.info('データの取得処理が正常に完了しました', `ID: ${id}`);
  }
}