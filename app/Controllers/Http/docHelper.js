const Route = use('Route')

const docHelper = {
    removeHead(verb){
        // return verb.filter(v => v!='HEAD')
    },
    groupRoute(list, params) {
        var Group = [];
        var contructor = {}
        list //Array of Routes
            .filter(route => params == 'index'? route:route._route.split('/')[1] == params)
            .map(l => {
                const groupName = (l._route.split('/').length >= 3)? l._route.split('/')[1]:'etc'
                if (contructor[groupName]) {
                    contructor[groupName].push(l)
                } else {
                    contructor[groupName] = []
                    contructor[groupName].push(l)
                }
            })

        for (list in contructor) {
            Group.push(contructor)
        }

        return Group
    },
    getRoute(url, path ,name) {
        
    }
}

module.exports = docHelper