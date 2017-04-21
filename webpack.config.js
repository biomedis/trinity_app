/* eslint-disable */
/*

Если запустить webpack --watch то он будет следить за изменениями файлов сам
webpack - сборка

apps
├── dir1
│   └── js
│       ├── main.js [entry 1]
│       └── bundle.js [output 1]
└── dir2
    ├── index.js [entry 2]
    └── foo.js [output 2]

Then try this in your module.exports:

{
  entry: {
    'dir1/js/bundle': __dirname + '/apps/dir1/js/main.js',
    'dir2/foo' : __dirname + '/apps/dir2/index.js'
  },
  output: {
    path: __dirname + '/apps',
    filename: '[name].js'
  },
  


}

сss надо импортировать в модуль иначе бандл не будет создан
*/
'use strict'

const NODE_ENV = process.env.NODE_ENV || 'dev';//переменная окружения. поутупает из аргументов webpack. Если нет то NODE_ENV='dev'
const CLEAN = process.env.CLEAN || '';

var webpack            = require('webpack');//сам вебпак
var CleanWebpackPlugin = require('clean-webpack-plugin');//очистка ресурсов
var ExtractTextPlugin=require('extract-text-webpack-plugin');//извлечение текста, для less и css
var path               = require('path');//работа с путями
var AssetsPlugin = require('assets-webpack-plugin');

const sep=path.sep;

//[hash] хеш всей компиляции, а [chunkhash] хэш файла
var cssName            = NODE_ENV === 'production' ? 'assets'+sep+'css'+sep+'[name]-[contenthash].css' : 'assets'+sep+'css'+sep+'[name].css';
var jsName             = NODE_ENV === 'production' ? 'assets'+sep+'js'+sep+'[name]-[chunkhash].js' : 'assets'+sep+'js'+sep+'[name].js';



var plugins = [
    new ExtractTextPlugin(cssName),
    new AssetsPlugin({filename:'assets.json', path: path.join(__dirname,'public','assets'),fullPath: false}),//создает файл с инфой о сборке статических файлов. чтобы в шаблонах можно было имена подставить
    new webpack.NoErrorsPlugin(),//не создавать файлы битые если были ошибки в процессе сборки
    new webpack.DefinePlugin({//определяет переменные доступные в коде модулей позже
        NODE_ENV:JSON.stringify(NODE_ENV),
        CFG:{
            //здесь можно прописать когфиги. будут доступны в коде через CFG.
            LANG: JSON.stringify('ru')
        }
    })//JSON имя:переменная  которые будут доступны как имя в коде, например NODE_ENV напрямую

//плагин, можно задействовать много раз, выделяет в файл сборки name модуль, который будет иметь общий код для указаных модулей.
// Нужно в браузере его подкл, до точек входа
        //,new webpack.optimize.CommonsChunckPlugin({name:имя файла на выходе , chunks:['модуль1','модуль2'] })
];
console.log("NODE_ENV="+NODE_ENV);
//очистка только если передали ключ. Смотри скрипты
if (CLEAN === 'clean') {
    plugins.push(

        new CleanWebpackPlugin([path.join('public','assets')], {
            root: __dirname,
            verbose: true,
            dry: false
        })
    );
}
    if (NODE_ENV === 'production') {
    plugins.push(new webpack.optimize.DedupePlugin());
    plugins.push(new webpack.optimize.OccurenceOrderPlugin());
    //сожмет js. Удалит ненужное и оптимизирует код.
    plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings:false,
                drop_console:true,
                unsafe:true
            }
        })
        );


}


module.exports={
    target: 'web',
    //в винде context не дает нормально отслеживать файлы, пришлось полные пути писать
    context: path.join(__dirname,'client'),
entry: {//точки входа, главные файлы модулей приложения. Их нельзя подключать в других модулях и точках входа! Они на самом верху

    main: path.join('js','main.js'),
    any_react: path.join('js','any_react.js'),
    react_app: path.join('js','react_app.js')
    
},
output: {
    path: path.join(__dirname,'public'), //абсолютный путь к директории сборки
    filename: jsName, // шаблон вместо [name] при сборке будут подставлены home.js и about.js
    library:"[name]", //имя модуля, которое можно использовать для вызовов
    publicPath:path.join('assets','js'),
    chunkFilename: NODE_ENV === 'production' ? '[id]-[chunkhash].js':'[id].js'
},
resolve:{
 root: __dirname,
 extensions:         ['', '.js', '.jsx'],
modulesDirectories:['node_modules','client']//где искать модули
},
    resolveLoader:{
        extensions:         ['', '.js', '.jsx'],
        modulesDirectories:['node_modules'],
        moduleTemplates:['*-loader','*']
    },
module:{//модули Webpack
	loaders:[

		{
		 test: /\.js$|\.jsx$/,
		loader:'babel',
	        query: {
		       presets: ['react', 'es2015','es2016','stage-0']
                //,stage:0
                //,optional:['runtime']//выносит общий код бабеля для модулей в одно место, чтобы не повторяться
	               },
		//exclude:[/node_modules/,/server/]
            include:__dirname+sep+'client'+sep
		},
		{
            test: /\.css$/,
			loader: ExtractTextPlugin.extract("style-loader", NODE_ENV=='production' ? "css-loader?minimize!autoprefixer-loader?browsers=last 2 version":"css-loader")
		
		},
        {
            test: /\.styl$/,
            loader: ExtractTextPlugin.extract("style-loader", NODE_ENV=='production' ? "css-loader?minimize!autoprefixer-loader?browsers=last 2 version!stylus-loader?resolve url":"css-loader!stylus-loader?resolve url&lineos")

        },
        {
            test: /\.less$/,
            loader: ExtractTextPlugin.extract("style-loader", NODE_ENV=='production' ? "css-loader?minimize!autoprefixer-loader?browsers=last 2 version!less-loader":"css-loader!less-loader")
        },
		{
		 test: /\.hbs$/,
		 loader: 'handlebars-loader',
		 exclude:[/node_modules/,/server/]
		},
        {
            test: /\.jade$/,
            loader: 'jade-loader',
            exclude:[/node_modules/,/server/]
        },
        //если файл меньше лимита, то он встраивается иначе генерятся файлы в public. Размещаются файлы по путям [path][name].[ext]
        { test: /\.gif$/, loader: 'url-loader?name=[path][name]'+(NODE_ENV === 'production' ? '-[hash]':'')+'.[ext]&limit=4096&mimetype=image/gif' },
        { test: /\.jpg$/, loader: 'url-loader?name=[path][name]'+(NODE_ENV === 'production' ? '-[hash]':'')+'.[ext]&limit=4096&mimetype=image/jpg' },
        { test: /\.png$/, loader: 'url-loader?name=[path][name]'+(NODE_ENV === 'production' ? '-[hash]':'')+'.[ext]&limit=4096&mimetype=image/png' },
        { test: /\.svg$/, loader: 'url-loader?name=[path][name]'+(NODE_ENV === 'production' ? '-[hash]':'')+'.[ext]&limit=15000&mimetype=image/svg+xml' },
        { test: /\.(woff|woff2|ttf|eot)/, loader: 'url-loader?name=[path][name]'+(NODE_ENV === 'production' ? '-[hash]':'')+'.[ext]&limit=1' },
        { test: /\.json$/, loader: 'json-loader' }
		]
},
plugins:plugins,
	watch: NODE_ENV =='dev',//включается при разработке Watch
	watchOptions:{
	aggregateTimeout:300
	}
    ,devtool:NODE_ENV =='dev' ? "source-map": null//данные для отладки. Не для продакшена. Можно использовать cheap-module-eval-source-map итп https://webpack.github.io/docs/configuration.html#devtool
    ,devServer: {
        headers: { 'Access-Control-Allow-Origin': '*' },
        host:'localhost',
        port:8090,
        proxy:{
            '*':'http://localhost:3000'
        }
    }
};
