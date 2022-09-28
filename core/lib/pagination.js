const pagination = (skip, limit, count) => {
    if (count <= 0) return { count, hasNext: false, hasPrevious: false, currentPage: 1, totalPage: 0 };

    const hasNext = skip + limit < count;
    const hasPrevious = skip > 0;
    const totalPage = Math.ceil(count / limit);
    const currentPage = Math.ceil(skip / limit) + 1;

    return { count, hasNext, hasPrevious, totalPage, currentPage };
};

export default pagination;
