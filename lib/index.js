'use strict';

var fs = require('fs'),
    path = require('path'),
    glob = require('glob');

function normalizeOptions(primary) {
    var resolved = {
        cwd: 'bower_components',
        minified: false
    };
    primary = primary || {};
    Object.keys(resolved)
        .forEach(function (key) {
            if (primary[key] !== null && primary[key] !== undefined) {
                resolved[key] = primary[key];
            }
        });
    return resolved;
}

module.exports = function bower_components(options) {
    options = normalizeOptions(options);

    var cwd = options.cwd,
        minified = options.minified;

    options = {
        cwd: cwd,
        dot: true
    };

    var components = glob.sync("*", options)
        .map(function (endpoint) {
            return {
                endpoint: endpoint,
                cwd: path.join(cwd, endpoint)
            };
        })
        .map(function (component) {
            var options = {
                cwd: component.cwd,
                dot: true
            };
            glob.sync("*{package,bower}.json", options)
                .map(function (json) {
                    json = fs.readFileSync(path.join(component.cwd, json));
                    json = JSON.parse(json.toString());
                    Object.keys(json).forEach(function (key) {
                        if (key.indexOf("_") === 0) {
                            return;
                        }
                        component[key] = json[key];
                    });
                    return component;
                });
            component.main = component.main || (component.endpoint ? component.endpoint + ".js" : null) || 'index.js';
            return component;
        });

    function makeQueries(component, plugin, min) {
        var main = plugin || component.main,
            extname = path.extname(main), ext,
            queries = [];
        if (min) {
            ext = extname.length ? extname : '.js';
            var basename = path.basename(main),
                key = new RegExp('^[^\\.]+', 'i').exec(basename)[0],
                minkeys = ["min", "compress", "compressed"].join(',');
            queries.push(key + "{\.,\-,\_}{" + minkeys + "}" + ext);
            queries = queries.map(function (query) {
                return path.join(component.cwd, "**", query);
            });
        }
        ext = extname.length ? '' : '.js';
        if (main === plugin) {
            queries.push(path.join(component.cwd, "**", main + "*" + ext));
        } else {
            queries.push(path.join(component.cwd, main + ext));
            if (ext.length) {
                queries.push(path.join(component.cwd, "**", main + "*" + ext));
            }
        }
        return queries;
    }

    function findResource(component, plugin, min) {
        var queries = makeQueries(component, plugin, min),
            founds;
        // console.log('queries:',queries);
        queries.some(function (query) {
            founds = glob.sync(query);
            return founds;
        });
        // console.log('founds:',founds);
        return founds[0];
    }

    if (false) {
        var UglifyJS = require("uglify-js");
        components.forEach(function (component) {
            if (component.minified) {
                return;
            }
            var file = path.join(component.cwd, component.main);
            try {
                var minified = UglifyJS.minify(file.toString()).code,
                    dirname = path.dirname(file),
                    basename = path.basename(file).replace(new RegExp('\\.([^\\.]+)$', 'i'), '.min.$1'),
                    dest = path.join(dirname, basename);
                fs.writeFileSync(dest, minified);
                component.minified = path.relative(component.cwd, dest);
            } catch (error) {
                console.log(component.main, error);
            }
        });
    }

    return function find(endpoint, plugin, options) {
        if (typeof plugin === 'boolean') {
            options = plugin;
            plugin = null;
        }
        if (typeof options === 'boolean') {
            options = {
                minified: options
            };
        } else {
            options = options || {
                minified: minified
            };
        }
        var component = components.filter(function (component) {
            return component.endpoint === endpoint;
        })[0];
        if (!component) {
            throw new Error(['"' + endpoint + '"', "is not found from", '"' + path.resolve(cwd) + '"'].join(' '));
        }
        return findResource(component, plugin, options.minified) || findResource(component, plugin);
    };
};