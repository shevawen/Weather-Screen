Weather Screen is a forecast viewer design for non-interactive screens.

## Usage

It is a single page app, you can deploy directly in any web server.

Set cities you concerned in `data/screens.json`.

```
[
  [
    {"name" :"London,United Kingdom","card_positon" : "t"},
    {"name" :"Buenos Aires","card_positon" : "b"},
    {"name" :"石家庄","card_positon" : "b"},
    {"name" :"太原","card_positon" : "t"},
    {"name" :"济南","card_positon" : "t"},
    {"name" :"呼和浩特","card_positon" : "b"}
    // more cities in this screen, at least two.
  ],
  [
    {"name" :"北京","card_positon" : "t"},
    {"name" :"天津","card_positon" : "b"},
    {"name" :"石家庄","card_positon" : "b"},
    {"name" :"太原","card_positon" : "t"},
    {"name" :"济南","card_positon" : "t"},
    {"name" :"呼和浩特","card_positon" : "b"}
  ]
  // more screens.
]
```
## Develop

Install dependencies

```
npm install
```

## Preview


## Data Source

The forecast data is fetch from heweather.com.
You can register an account to get a free license of data API.
Replace the value of `heweather_key` in `weather-screen.js` by your own key.


Weather Screen 是为非交互性屏幕(比如电视)设计的天气显示界面，可以通过切换场景显示多个定制城市的天气预报。

## 用法

这是一个静态的单页应用，直接发布在任何 Web Server 中即可。

## 开发

通过 NPM 安装依赖

```
npm install
```

## 预览

## 数据源

预报数据来自 [和风天气](heweather.com).
你可以在该网站上注册一个账户，注册后可以获得一个免费的授权，然后用获得的 Key 替换 `weather-screen.js` 里的 `heweather_key`
