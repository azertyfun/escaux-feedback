exports.validate = (json, keys) => {
    for(let key of keys) {
        if (json[key] === undefined) {
            console.error(`Missing ${key}`);
            return false;
        }
    }

    return true;
}