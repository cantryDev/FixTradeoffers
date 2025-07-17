# FixTradeoffers

This extension loads the tradeoffers with the help of your accessToken + apikey which is more stable.
The extension only load the tradeoffers with accessToken + apikey if the page shows the loading error. Only then you have to enter your apikey once.
The accessToken will be parsed from the Tradeofferpage automatically.


## Showcase

<img alt="Showcase" src="https://github.com/cantryDev/FixTradeoffers/blob/master/Showcase.gif?raw=true">

## Disclaimer

SteamAPI sometimes returns weird data. Always doublecheck the trade in the actual tradeoffer window (when you click on one). 
Visual bugs may appear.
Use at your own risk.

## Installation

### Chrome

1. Download and unzip the zip file. (Top Right -> Code -> Download ZIP) 
2. Visit chrome://extensions (via omnibox or menu -> Tools -> Extensions).
3. Enable Developer mode by ticking the checkbox in the upper-right corner.
4. Click on the "Load unpacked extension..." button.
5. Select the directory src -> de -> cantry -> fixtradeoffers.

### FireFox

1. Download and unzip the zip file. (Top Right -> Code -> Download ZIP)
2. Visit about:addons (just copy it into the url bar).
3. Click the gear icon.
4. Install Addons from file.
5. Open the folder signed and select fixTradeoffers.xpi

## Known Bugs

- SteamAPI sometimes returns incomplete data (these tradeoffers will be hidden).
- Other Extensions which manipulate the tradeoffers page wont change the page. 
- Declining Tradeoffers only works on the tradeoffer page itself.
- Sent tradeoffers are still broken