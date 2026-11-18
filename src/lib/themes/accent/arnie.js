// アニー・イールド公式サイト（arnie-yield.com）の配色に合わせたアクセント。
// 黒地 #0D0D0D に黄色 #FFF600、サブの水色 #66CCFF。
const YELLOW = '#FFF600';
const YELLOW_DARK = '#C9C200';
const CYAN = '#66CCFF';
const BLACK = '#0D0D0D';

const guiColors = {
    'motion-primary': CYAN,
    'motion-primary-transparent': '#66ccffe6',
    'motion-tertiary': '#3399CC',

    'looks-secondary': YELLOW,
    'looks-transparent': '#fff60033',
    'looks-light-transparent': '#fff60026',
    'looks-secondary-dark': YELLOW_DARK,

    'extensions-primary': CYAN,
    'extensions-tertiary': '#3399CC',
    'extensions-transparent': '#66ccff59',
    'extensions-light': '#BFE8FF',

    'drop-highlight': '#FFFA80',

    // 上部のバー: 黒地に、公式サイトの帯を思わせる黄色の線を下に引く
    'menu-bar-background': BLACK,
    'menu-bar-background-image': `linear-gradient(to top, ${YELLOW} 0, ${YELLOW} 3px, transparent 3px)`,
    'menu-bar-foreground': '#F0F0F0',

    // 黄色の上に白文字だと読めないので、黄色地の見出しは黒文字にする
    'ui-modal-header-background': YELLOW,
    'ui-modal-header-foreground': BLACK,

    'looks-secondary-foreground': BLACK,
    'looks-secondary-icon-filter': 'brightness(0)',

    'link-color': CYAN
};

const blockColors = {
    checkboxActiveBackground: YELLOW,
    checkboxActiveBorder: YELLOW_DARK
};

export {
    guiColors,
    blockColors
};
