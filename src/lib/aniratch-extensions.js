// Aniratch に同梱している拡張機能の URL。
// ページと同じ場所（ROOT）の extensions/ に置いてあるので、そのページ自身から読み込む。
// わんコメ連携の拡張は、ローカル用のビルド（ANIRATCH_ONECOMME=1。わんコメのテンプレートとして配信）にだけ入る。

const root = process.env.ROOT || '/';
const base = typeof location === 'undefined' ? '' : `${location.origin}${root.startsWith('/') ? root : `/${root}`}`;

export const ONECOMME_EXTENSION_URL = `${base}extensions/onecomme.js`;

// このページ自身の extensions/ にある拡張だけを、確認なしで読み込む
export const isAniratchExtension = url => !!base && url.startsWith(`${base}extensions/`);
