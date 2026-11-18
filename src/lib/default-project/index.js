import projectData from './project-data';

/* eslint-disable import/no-unresolved */
import overrideDefaultProject from '!arraybuffer-loader!./override-default-project.sb3';
import backdrop from '!raw-loader!./cd21514d0531fdffb22204e0ec5ed84a.svg';
import costume1 from '!arraybuffer-loader!./anipen-walk1.png';
import costume2 from '!arraybuffer-loader!./anipen-walk2.png';
/* eslint-enable import/no-unresolved */
import {TextEncoder} from '../tw-text-encoder';

const defaultProject = translator => {
    if (overrideDefaultProject.byteLength > 0) {
        return [{
            id: 0,
            assetType: 'Project',
            dataFormat: 'JSON',
            data: overrideDefaultProject
        }];
    }

    let _TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('text-encoding').TextEncoder;
    } else {
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }, {
        id: '05ef62f7b711744f82fb18eec3c830ce',
        assetType: 'ImageBitmap',
        dataFormat: 'PNG',
        data: new Uint8Array(costume1)
    }, {
        id: '03e79bc04c23d1d89c4fb05b5331ffe6',
        assetType: 'ImageBitmap',
        dataFormat: 'PNG',
        data: new Uint8Array(costume2)
    }];
};

export default defaultProject;
