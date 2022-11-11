require('./src/index')().catch(e => {
    console.error(e);

    return [];
}).then(res => {
    process.stdout.write(JSON.stringify(res));
});