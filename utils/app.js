const fs = require ('fs');

const Loadtask = () => {
    const task = fs.readFileSync('data/task.json', "utf-8");
    const json = JSON.parse(task);
    return json;
}

// const deletetask = () => {
//     const task = fs.readFileSync('./data/task.json', "utf-8");
//     let json = JSON.parse(task);

//     json = json.filter(t => t.id != id || req.session.user.username);

//     fs.writeFileSync('data/task.json', JSON.stringify(json));    
// }

module.exports = {Loadtask};
