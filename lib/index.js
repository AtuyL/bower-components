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

    var minified = options.minified;

    options = {
        cwd: options.cwd,
        dot: true
    };

    var components = glob.sync("*", options)
        .map(function (endpoint) {
            return {
                endpoint: endpoint,
                cwd: path.join(options.cwd, endpoint)
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

    function makeQuery(component, plugin, min) {
        var main = plugin || component.main,
            extname = path.extname(main);
        if (min) {
            extname = extname.length ? extname : '.js';
            var basename = path.basename(main),
                key = new RegExp('^[^\\.]+', 'i').exec(basename)[0];
            return path.join(component.cwd, "**", key + "*min*" + extname);
        }
        extname = extname.length ? '' : '.js';
        if (main === plugin) {
            return path.join(component.cwd, "**", main + "*" + extname);
        }
        return path.join(component.cwd, main + extname);
    }

    function findResource(component, plugin, min) {
        var query = makeQuery(component, plugin, min),
            founds = glob.sync(query);
        if (founds.length > 1) {
            var mainpath = path.join(component.cwd, component.main);
            return founds.sort(function (a, b) {
                a = path.dirname(path.relative(mainpath, a)).length;
                b = path.dirname(path.relative(mainpath, b)).length;
                return a > b;
            })[0];
        }
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
        return findResource(component, plugin, options.minified) || findResource(component, plugin);
    };
};