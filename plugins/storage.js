import fs from 'fs';
import path from 'path';
import fp from 'fastify-plugin';

// XXX maybe we can try a cloud storage like s3, cloudinary, etc.
const storagePlugin = async (fastify, opts, next) => {

    const base = opts.base || './public/uploads';
    const urlPrefix = opts.urlPrefix || '/public/uploads';
    fastify.decorate('storage', {
        async store(filename, buffer) {
            const date = new Date();
            let localFilename = date.getTime();
            const extIndex = filename?.lastIndexOf('.') || -1;
            if (extIndex !== -1) localFilename = localFilename + filename.substring(extIndex);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dir = `${base}/${year}/${month}`;

            if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(`${dir}/${localFilename}`, buffer);

            return `${urlPrefix}/${year}/${month}/${localFilename}`;
        },
        async delete(url) {
            if (!url) return;
            if (url.startsWith('http')) return; // we can only delete file on the disk
            try {
                await fs.promises.unlink(path.join(process.cwd(), url));
            } catch (e) {
                fastify.log.warn(e);
            }
        }
    });

    next();
};

export default fp(storagePlugin);
