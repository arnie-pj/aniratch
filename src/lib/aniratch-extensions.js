// Aniratch に同梱している拡張機能の URL。
// ページと同じ場所（ROOT）の extensions/ に置いてあるので、テスト版・公開版のどちらでもそのページ自身から読み込む。

const root = process.env.ROOT || '/';
const base = typeof location === 'undefined' ? '' : `${location.origin}${root.startsWith('/') ? root : `/${root}`}`;

export const ONECOMME_EXTENSION_URL = `${base}extensions/onecomme.js`;

// テスト版で保存した作品を公開版で開いても（その逆でも）確認なしで読み込めるよう、両方を信頼する
const TRUSTED_PREFIXES = [
    `${base}extensions/`,
    'https://arnie-pj.github.io/aniratch/extensions/',
    'https://arnie-pj.github.io/aniratch-test/extensions/'
];

export const isAniratchExtension = url => TRUSTED_PREFIXES.some(prefix => url.startsWith(prefix));
