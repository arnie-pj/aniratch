// わんコメ連携拡張（Aniratch 同梱）
// わんコメ（OneComme）のローカル API に WebSocket でつなぎ、届いたコメントをブロックで扱えるようにする。
// わんコメが起動していなければ接続できないだけで、ほかの動作には影響しない。
// https の公開ページからつなぐ場合は、わんコメの設定で接続元（このページのホスト）を許可しておく必要がある。
(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('わんコメ拡張はサンドボックスなしで読み込む必要があります');
    }

    const vm = Scratch.vm;
    const runtime = vm.runtime;
    const EXTENSION_ID = 'onecomme';
    const HAT_OPCODE = `${EXTENSION_ID}_whenComment`;
    const RETRY_MS = 5000;

    const EMPTY = {
        service: '',
        data: {}
    };

    let host = '127.0.0.1';
    let port = 11180;
    let socket = null;
    let connected = false;
    let lastError = '';
    let retryTimer = null;
    let wantConnection = true;

    /** 届いたがまだハットを動かしていないコメント */
    const queue = [];
    /** いま処理中（最後にハットを動かした）コメント */
    let current = EMPTY;
    /** これまでに受け取ったコメントの数（接続し直しても数え続ける） */
    let receivedCount = 0;

    const asText = value => (value === null || typeof value === 'undefined' ? '' : String(value));

    const scheduleRetry = () => {
        if (retryTimer || !wantConnection) return;
        retryTimer = setTimeout(() => {
            retryTimer = null;
            connect();
        }, RETRY_MS);
    };

    const handleMessage = event => {
        let message;
        try {
            message = JSON.parse(event.data);
        } catch (e) {
            return;
        }
        if (!message || !message.type) return;
        // connected には接続前のコメントが入っている。過去のぶんでハットを動かさないよう無視する。
        if (message.type === 'comments') {
            const comments = (message.data && message.data.comments) || [];
            for (const comment of comments) {
                if (comment && comment.data) {
                    queue.push(comment);
                    receivedCount++;
                }
            }
        }
    };

    const connect = () => {
        if (socket) return;
        wantConnection = true;
        let ws;
        try {
            ws = new WebSocket(`ws://${host}:${port}/sub?p=comments`);
        } catch (e) {
            lastError = asText(e && e.message);
            scheduleRetry();
            return;
        }
        socket = ws;
        ws.addEventListener('open', () => {
            connected = true;
            lastError = '';
        });
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('error', () => {
            lastError = 'わんコメにつなげませんでした（起動しているか、接続元が許可されているか確認してください）';
        });
        ws.addEventListener('close', () => {
            if (socket === ws) {
                socket = null;
                connected = false;
                scheduleRetry();
            }
        });
    };

    const disconnect = () => {
        wantConnection = false;
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        if (socket) {
            const ws = socket;
            socket = null;
            connected = false;
            ws.close();
        }
    };

    // 1 フレームに 1 件ずつコメントを取り出してハットを動かす。
    // 同時に何件届いても、ハットの中で読むブロックはそのフレームのコメントを指す。
    runtime.on('BEFORE_EXECUTE', () => {
        if (queue.length === 0) return;
        current = queue.shift();
        runtime.startHats(HAT_OPCODE);
    });

    // 旗やプロジェクトの読み込みで、たまっていたコメントを捨てる
    runtime.on('PROJECT_START', () => {
        queue.length = 0;
    });

    const fetchAsCostume = async (url, name) => {
        // アイコンの取得先（YouTube の画像サーバーなど）ごとに許可ダイアログが出ないよう、通常の fetch を使う
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = response.headers.get('content-type') || '';
        const buffer = new Uint8Array(await response.arrayBuffer());
        let dataFormat = 'png';
        let assetType = runtime.storage.AssetType.ImageBitmap;
        if (contentType.includes('svg') || url.startsWith('data:image/svg')) {
            dataFormat = 'svg';
            assetType = runtime.storage.AssetType.ImageVector;
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            dataFormat = 'jpg';
        }
        const asset = runtime.storage.createAsset(assetType, dataFormat, buffer, null, true);
        return {
            name,
            asset,
            assetId: asset.assetId,
            md5: `${asset.assetId}.${dataFormat}`,
            dataFormat,
            bitmapResolution: dataFormat === 'svg' ? 1 : 2
        };
    };

    class OneCommeExtension {
        getInfo () {
            return {
                id: EXTENSION_ID,
                name: 'わんコメ',
                color1: '#3d3d3d',
                color2: '#2a2a2a',
                color3: '#FFF600',
                blocks: [
                    {
                        opcode: 'whenComment',
                        blockType: Scratch.BlockType.EVENT,
                        text: 'コメントが来たとき',
                        isEdgeActivated: false,
                        shouldRestartExistingThreads: false
                    },
                    '---',
                    {
                        opcode: 'commentName',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '名前'
                    },
                    {
                        opcode: 'commentText',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'コメント'
                    },
                    {
                        opcode: 'commentInfo',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'コメントの [FIELD]',
                        arguments: {
                            FIELD: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'fields',
                                defaultValue: 'price'
                            }
                        }
                    },
                    {
                        opcode: 'commentFlag',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'コメントが [FLAG]',
                        arguments: {
                            FLAG: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'flags',
                                defaultValue: 'gift'
                            }
                        }
                    },
                    '---',
                    {
                        opcode: 'setIconCostume',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'コメントした人のアイコンをコスチュームにする'
                    },
                    '---',
                    {
                        opcode: 'isConnected',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'わんコメにつながっている'
                    },
                    {
                        opcode: 'connectTo',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'わんコメ [HOST] : [PORT] につなぐ',
                        arguments: {
                            HOST: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '127.0.0.1'
                            },
                            PORT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 11180
                            }
                        }
                    },
                    {
                        opcode: 'disconnect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'わんコメから切断する'
                    },
                    {
                        opcode: 'receivedCount',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '受け取ったコメントの数'
                    },
                    {
                        opcode: 'connectionError',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '接続エラー'
                    }
                ],
                menus: {
                    fields: {
                        acceptReporters: false,
                        items: [
                            {text: 'スパチャの金額（数値）', value: 'price'},
                            {text: 'スパチャの金額（表示）', value: 'paidText'},
                            {text: '通貨', value: 'unit'},
                            {text: 'アイコンのURL', value: 'profileImage'},
                            {text: 'ユーザーID', value: 'userId'},
                            {text: 'コメントID', value: 'id'},
                            {text: '配信サービス', value: 'service'},
                            {text: '枠の名前', value: 'frameName'},
                            {text: '時刻', value: 'timestamp'}
                        ]
                    },
                    flags: {
                        acceptReporters: false,
                        items: [
                            {text: 'スパチャ・ギフト', value: 'gift'},
                            {text: 'メンバー', value: 'member'},
                            {text: 'モデレーター', value: 'moderator'},
                            {text: '配信者本人', value: 'owner'},
                            {text: '初コメ', value: 'firstTime'}
                        ]
                    }
                }
            };
        }

        whenComment () {
            return true;
        }

        commentName () {
            const d = current.data;
            return asText(d.displayName || d.name);
        }

        commentText () {
            const d = current.data;
            // comment は絵文字などの HTML を含むことがあるので、タグを外した文字にする
            return asText(d.comment).replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, '$1')
                .replace(/<[^>]+>/g, '')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, '\'')
                .replace(/&amp;/g, '&');
        }

        commentInfo (args) {
            const d = current.data;
            switch (args.FIELD) {
            case 'price': return Number(d.price) || 0;
            case 'paidText': return asText(d.paidText);
            case 'unit': return asText(d.unit);
            case 'profileImage': return asText(d.profileImage);
            case 'userId': return asText(d.userId);
            case 'id': return asText(d.id);
            case 'service': return asText(current.service);
            case 'frameName': return asText(current.name);
            case 'timestamp': return asText(d.timestamp);
            default: return '';
            }
        }

        commentFlag (args) {
            const d = current.data;
            switch (args.FLAG) {
            case 'gift': return !!d.hasGift;
            case 'member': return !!d.isMember;
            case 'moderator': return !!d.isModerator;
            case 'owner': return !!d.isOwner;
            case 'firstTime': return !!d.isFirstTime;
            default: return false;
            }
        }

        async setIconCostume (args, util) {
            const url = asText(current.data.profileImage);
            if (!url) return;
            const target = util.target;
            if (target.isStage) return;
            try {
                const name = `アイコン_${asText(current.data.userId || current.data.name).slice(0, 40)}`;
                // 同じ人のアイコンがもう入っていれば、追加せずにそれに切り替える
                const existing = target.getCostumeIndexByName(name);
                if (existing >= 0) {
                    target.setCostume(existing);
                    return;
                }
                const costume = await fetchAsCostume(url, name);
                await vm.addCostume(costume.md5, costume, target.id);
                target.setCostume(target.getCostumes().length - 1);
            } catch (e) {
                lastError = `アイコンを読み込めませんでした: ${asText(e && e.message)}`;
            }
        }

        isConnected () {
            return connected;
        }

        connectTo (args) {
            const newHost = asText(args.HOST).trim() || '127.0.0.1';
            const newPort = Math.round(Number(args.PORT)) || 11180;
            if (newHost === host && newPort === port && (socket || connected)) return;
            disconnect();
            host = newHost;
            port = newPort;
            connect();
        }

        disconnect () {
            disconnect();
        }

        receivedCount () {
            return receivedCount;
        }

        connectionError () {
            return lastError;
        }
    }

    Scratch.extensions.register(new OneCommeExtension());
    connect();
})(Scratch);
