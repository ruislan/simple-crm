import fetch from 'node-fetch';
import fs from 'fs';
import dayjs from 'dayjs';

const regions = JSON.parse(fs.readFileSync('./public/regions.json'));

const fetcherFactory = {
    // ws connection
    newMonitor: function (connection) {
        return {
            connection,
            progress: async function (text) {
                if (this.connection) {
                    this.connection.socket.send(JSON.stringify({
                        code: 200, // information
                        tips: 'progress',
                        message: text,
                    }));
                }
            },
            log: async function (level, text) {
                if (this.connection) {
                    const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
                    this.connection.socket.send(JSON.stringify({
                        code: 200, // information
                        tips: 'log',
                        message: `${time} - ${level} - ${text}`,
                    }));
                }
            },
            info: async function (text) {
                await this.log('信息', text);
            },
            warn: async function (text) {
                await this.log('警告', text);
            },
            error: async function (text) {
                await this.log('错误', text);
            }
        };
    },
    newBaiduFetcher: function (key, monitor) {
        return {
            key,
            pageSize: 20, // baidu 默认最大值
            monitor,
            fetch: async function (params, dataSet) {
                await this.fetchByKeywords(params, dataSet);
            },
            fetchByKeywords: async function (params, dataSet) {
                const { keywords, city, district } = params;
                let region = city;
                if (region !== '全国') region += district;

                const url = `https://api.map.baidu.com/place/v2/search?query=${keywords}&region=${region}&output=json&ak=${this.key}&page_size=${this.pageSize}`;
                let count = 0;
                for (let pageNum = 0; pageNum < 100; pageNum++) {
                    try {
                        let res = await fetch(`${url}&page_num=${pageNum}`, {});
                        if (res.ok) {
                            const json = await res.json();
                            if (json.total == 0) break; // 没有数据就不处理了。
                            const pois = this.transform(json.results || []);
                            if (this.monitor) this.monitor.info(`百度：关键词【${keywords}】，第 ${pageNum + 1} 页，共计 ${pois.length} 条`);
                            dataSet.collect(pois);
                            count += pois.length;
                        } else {
                            if (this.monitor) this.monitor.error(`百度：请求失败，状态码：${res.status}`);
                        }
                    } catch (e) {
                        if (this.monitor) this.monitor.warn(e);
                    }
                }
                if (this.monitor) this.monitor.info(`百度：地区【${region}】，关键字【${keywords}】处理完成，处理了 ${count} 条数据`);
            },
            transform: function (pois) {
                let result = [];
                for (const poi of pois) {
                    if (!poi.telephone) continue;
                    result.push({
                        id: poi.uid,
                        name: poi.name,
                        phone: poi.telephone,
                        type: poi.type || '',
                        province: poi.province,
                        city: poi.city,
                        area: poi.area,
                        address: poi.address,
                        location: `${poi.location?.lat || '-'} , ${poi.location?.lng || '-'}`,
                        source: 'baidu',
                        photos: [],
                    });
                }
                return result;
            }
        };
    },
    newGaodeFetcher: function (key, monitor) {
        return {
            key,
            pageSize: 25,
            monitor,
            fetch: async function (params, dataSet) {
                await this.fetchByKeywords(params, dataSet);
                await this.fetchByPolygon(params, dataSet);
            },

            fetchByKeywords: async function (params, dataSet) {
                const { keywords, city } = params;
                const url = `https://restapi.amap.com/v3/place/text?key=${this.key}&keywords=${keywords}&offset=${this.pageSize}&city=${city}&citylimit=true`;
                let count = 0;
                for (let pageNum = 1; pageNum <= 100; pageNum++) {
                    let res = await fetch(`${url}&page=${pageNum}`, {});
                    try {
                        if (res.ok) {
                            const json = await res.json();
                            if (json.count == 0) break; // 没有数据就不处理了。
                            const pois = this.transform(json.pois, city);
                            if (this.monitor) this.monitor.info(`高德：关键词【${keywords}】，第 ${pageNum} 页，共计 ${pois.length} 条`);
                            dataSet.collect(pois);
                            count += pois.length;
                        } else {
                            if (this.monitor) this.monitor.error(`高德：请求失败，状态码：${res.status}`);
                        }
                    } catch (e) {
                        if (this.monitor) this.monitor.warn(e);
                    }
                }
                if (this.monitor) this.monitor.info(`高德：关键字【keywords】处理完成，处理了 ${count} 条数据`);
            },
            transform: function (pois, city) {
                let result = [];
                for (const poi of pois) {
                    const photos = [];
                    for (const photo of poi.photos) {
                        photos.push({ url: photo.url });
                    }
                    // 如果又没有电话，又没有图片，这个数据就是无效的
                    if (!poi.tel && photos.length == 0) continue;
                    if (!poi.cityname.includes(city)) continue;

                    // tel 居然有[]这样的值...
                    result.push({
                        id: poi.id,
                        name: poi.name?.toString(),
                        phone: poi.tel?.toString(),
                        type: poi.type?.toString() || '',
                        province: poi.pname?.toString(),
                        city: poi.cityname?.toString(),
                        area: poi.adname?.toString(),
                        address: poi.address?.toString(),
                        location: poi.location?.toString(),
                        source: 'gaode',
                        photos,
                    });
                }
                return result;
            },

            fetchByPolygon: async function (params, dataSet) {
                const { keywords, city } = params;
                const url = `https://restapi.amap.com/v3/place/polygon?key=${this.key}&keywords=${keywords}&offset=${this.pageSize}&show_fields=children,business,photos`;

                const polygons = await this.fetchDistrict(city);
                const polygonList = polygons.split(';').map(gen => gen.split(','));
                const list = await new Rectangle(polygonList, this, 50).toRectangleList(keywords);

                if (this.monitor) this.monitor.info(`高德：城市【${city}】边界，共细分成了【${list.length}】个子区域。`);

                let count = 0;
                for (const rect of list) {
                    const pathString = rect.getPathString();
                    for (let pageNum = 1; pageNum <= 100; pageNum++) {
                        try {
                            const res = await fetch(`${url}&polygon=${pathString}&page=${pageNum}`, {});
                            if (res.ok) {
                                const json = await res.json();
                                if (json.count == 0) break; // 没有数据就不处理了。
                                if (this.monitor) this.monitor.info(`高德：关键词【${keywords}】，第 ${pageNum} 页，共计 ${json.count} 条`);
                                const pois = this.transform(json.pois, city);
                                dataSet.collect(pois);
                                count += Number(json.count);
                            } else {
                                if (this.monitor) this.monitor.error(`高德：请求失败，状态码：${res.status}`);
                            }
                        } catch (e) {
                            if (this.monitor) this.monitor.warn(e);
                        }
                    }
                }
                if (this.monitor) this.monitor.info(`高德：范围查询完成，共查询了【${count}】 条数据。`);
            },

            fetchDistrict: async function (city) {
                const url = `https://restapi.amap.com/v3/config/district?keywords=${city}&subdistrict=0&key=${this.key}&extensions=all`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    if (json.districts && json.districts.length > 0) {
                        if (this.monitor) this.monitor.info(`高德：城市【${city}】 边界获取完成`);
                        return json.districts[0].polyline;
                    }
                }
                return '';
            },
            fetchCount: async function (keywords, path) {
                const url = `https://restapi.amap.com/v3/place/polygon?key=${this.key}&keywords=${keywords}&offset=${this.pageSize}&polygon=${path}`;
                let res = await fetch(url);
                let count = 0;
                if (res.ok) {
                    const json = await res.json();
                    count = json?.count || 0;
                }
                if (this.monitor) this.monitor.info(`高德：区域边框：【${path}】，得到数量：【${count}】 条数据`);
                return count;
            }
        };
    }
}

// 地图矩形分隔
class Rectangle {
    constructor(polygonList, fetchEngine, sizeLimit) {
        let maxX = 0;
        let minX = 9999999;
        let maxY = 0;
        let minY = 9999999;

        // polygon的数据不一定是有效的，所以我们只需要有效数据
        for (let i = 0; i < polygonList.length; i += 1) {
            const curX = Number(polygonList[i][0]);
            const curY = Number(polygonList[i][1]);
            if (curX && curY) {
                maxX = Math.max(maxX, curX);
                minX = Math.min(minX, curX);
                maxY = Math.max(maxY, curY);
                minY = Math.min(minY, curY);
            }
        }
        this.x0 = minX;
        this.y0 = minY;
        this.x1 = maxX;
        this.y1 = maxY;
        this.count = 0;

        this.fetchEngine = fetchEngine;
        this.sizeLimit = sizeLimit;
    }

    getPath() {
        return [
            [this.x0, this.y0],
            [this.x1, this.y0],
            [this.x1, this.y1],
            [this.x0, this.y1],
        ];
    }

    getPathString() {
        return this.getPath().map(p => p.join(',')).join('|');
    }

    toString() {
        return `count: ${this.count}, path: [[${this.x0}, ${this.y0}], [${this.x1}, ${this.y0}], [${this.x1}, ${this.y1}], [${this.x0}, ${this.y1}]]`;
    }

    splitTo4() {
        let x0 = this.x0;
        let y0 = this.y0;
        let x1 = this.x1;
        let y1 = this.y1;
        let xm = (x0 + x1) / 2;
        let ym = (y0 + y1) / 2;

        return [
            new Rectangle([[x0, y0], [xm, y0], [xm, ym], [x0, ym]], this.fetchEngine, this.sizeLimit),
            new Rectangle([[xm, y0], [x1, y0], [x1, ym], [xm, ym]], this.fetchEngine, this.sizeLimit),
            new Rectangle([[x0, ym], [xm, ym], [xm, y1], [x0, y1]], this.fetchEngine, this.sizeLimit),
            new Rectangle([[xm, ym], [x1, ym], [x1, y1], [xm, y1]], this.fetchEngine, this.sizeLimit),
        ];
    }

    async toRectangleList(keywords) {
        const count = await this.fetchEngine.fetchCount(keywords, this.getPathString());
        let result = [];
        this.count = count;
        if (count > 0) { // 有内容才继续分割
            if (count > this.sizeLimit) {
                const rectangles = this.splitTo4();
                for (let i = 0; i < rectangles.length; i++) {
                    const rect = rectangles[i];
                    const list = await rect.toRectangleList(keywords);
                    result = result.concat(list);
                }
            } else {
                result.push(this);
            }
        }
        return result;
    }
}

const fetchData = async function (monitor, data) {
    let { keyword, province, city, sources } = data;
    const cityText = regions[`0,${province}`][city] || '全国';
    const keywords = (keyword?.split('/') || []).join('|');
    const hasBaidu = sources?.includes('baidu') || false;
    const hasGaode = sources?.includes('gaode') || false;

    // process collect
    const params = { keywords, city: cityText, district: '' };
    const dataSet = {
        data: new Map(),
        collect: function (pois) {
            for (const poi of pois) {
                this.data.set(poi.id, poi);
            }
        },
        toArray: function () {
            const result = [];
            this.data.forEach((v, _) => result.push(v));
            return result;
        }
    };


    monitor.progress('25%');
    if (hasGaode) {
        const fetcher = fetcherFactory.newGaodeFetcher(process.env.GAODE_KEY, monitor);
        await fetcher.fetch(params, dataSet);
    }

    monitor.progress('50%');
    if (hasBaidu) { // 百度通过组合不同的区县来查询
        const districtKey = `0,${province},${city}`;
        const districtObj = regions[districtKey];
        if (districtObj) {
            const fetcher = fetcherFactory.newBaiduFetcher(process.env.BAIDU_KEY, monitor);
            for (const key of Object.keys(districtObj)) {
                const districtText = districtObj[key];
                await fetcher.fetch({ ...params, district: districtText }, dataSet);
            }
        }
    }
    // result
    return dataSet.toArray();
}

const saveData = async function (db, monitor, data) {
    // XXX createMany not support for sqlite, disgusting
    let beforeCount = 0;
    let afterCount = 0;
    try {
        beforeCount = await db.customer.count();
        for (const item of data) {
            // 将id设置成频道对象id，这里的id是我们的id
            item.id = undefined;
            item.photos = { create: item.photos };

            // test phone and name exists
            let exists = false;
            if (item.phone !== '') exists = await db.customer.count({ where: { phone: item.phone } }) > 0;
            if (item.name !== '') exists = await db.customer.count({ where: { name: item.name } }) > 0;
            if (!exists) await db.customer.create({ data: item });
        }
        afterCount = await db.customer.count();
    } catch (e) {
        monitor.error(e);
    }
    monitor.info(`数据存储处理完成，共存储${afterCount - beforeCount}条数据。`);
}

const dataset = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => reply.view('system/dataset.html'));

    fastify.get('/ws', { websocket: true }, (connection, req) => {
        connection.socket.on('message', message => {
            // parse incoming message
            let msg = undefined;
            try {
                msg = JSON.parse(message.toString());
            } catch (e) {
                connection.socket.send(JSON.stringify({ code: 400, message: 'command is unsupported' }));
                return;
            }

            // handler command
            try {
                const code = msg.code;
                const data = msg.data;
                switch (code) {
                    case 'collect':
                        (async function () {
                            const monitor = fetcherFactory.newMonitor(connection);
                            const result = await fetchData(monitor, data);
                            monitor.progress('75%');
                            await saveData(fastify.db, monitor, result);
                            monitor.progress('100%');
                            connection.socket.send(JSON.stringify({ code: 200, tips: 'ok', message: '处理完成' }));
                            connection.socket.close(); // close it
                        })();
                        break;
                    default:
                        connection.socket.send(JSON.stringify({ code: 400, message: 'command is unsupported' }));
                        break;
                }
            } catch (e) {
                connection.socket.send(JSON.stringify({ code: 500, message: 'server error' }));
                connection.socket.close();
            }
        });
    });
};

export default dataset;