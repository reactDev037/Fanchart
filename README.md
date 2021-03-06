[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/reactDev037/Fanchart/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/reactDev037/Fanchart/?branch=master)
[![Code Climate](https://codeclimate.com/github/reactDev037/Fanchart/badges/gpa.svg)](https://codeclimate.com/github/reactDev037/Fanchart)
[![Test Coverage](https://codeclimate.com/github/reactDev037/Fanchart/badges/coverage.svg)](https://codeclimate.com/github/reactDev037/Fanchart/coverage)
[![Issue Count](https://codeclimate.com/github/reactDev037/Fanchart/badges/issue_count.svg)](https://codeclimate.com/github/reactDev037/Fanchart)

# Ancestral fan chart
This modules provides an SVG ancestral fan chart for the [webtrees](https://www.webtrees.net) genealogy application.

![210 Degree chart](assets/fan-chart-210.png)
![210 Degree chart with color gradients and hidden empty segments](assets/fan-chart-210-gradient.png)


## Installation
### Using Composer
To install using [composer](https://getcomposer.org/), just run the following command from the command line
at the root directory of your webtrees installation.

```
composer require reactDev037/Fanchart --update-no-dev
```

The module will automatically installed into the ``modules_v3`` directory of your webtrees installation.

To remove the module run:
```
composer remove reactDev037/Fanchart --update-no-dev
```

### Using Git
If you are using ``git``, you could also clone the current master branch directly into your ``modules_v3`` directory
by calling:

```
git clone https://github.com/reactDev037/Fanchart.git modules_v3/ancestral-fan-chart
```

### Manual installation
To manually install the module, perform the following steps:

1. Download the [latest release](https://github.com/reactDev037/Fanchart/releases/latest).
2. Upload the downloaded file to your web server.
3. Unzip the package into your ``modules_v3`` directory.
4. Rename the folder to ``Fanchart``

## Enable module
Go to the control panel (admin section) of your installation and click on the ``Module administration`` link
inside the ``Modules`` section. Enable the ``Ancestral fan chart`` module and save your settings.

![Control panel - Module administration](assets/control-panel-modules.png)


## Usage
At the charts menu, you will find a new link called `Ancestral fan chart`.


## Development
To build/update the custom d3 version, run the following commands inside the ``/js/packages`` directory:

```
npm install
npm run prepare
```
