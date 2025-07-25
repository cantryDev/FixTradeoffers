let iconUrlPrefix = "https://steamcommunity-a.akamaihd.net/economy/image/";
let iconResSuffix = "/96fx96f";

var observer = new MutationObserver(function (mutations, me) {
    var errorDetails = document.getElementsByClassName('profile_fatalerror_message')[0];
    if (errorDetails !== undefined) {
        let cssElement = document.createElement("link");
        cssElement.setAttribute("href", "https://steamcommunity-a.akamaihd.net/public/css/skin_1/profile_tradeoffers.css?v=YP3-1xEiIwFe&l=english");
        cssElement.setAttribute("rel", "stylesheet");
        cssElement.setAttribute("type", "text/css");
        document.head.appendChild(cssElement);
        chrome.storage.local.get(["steamAPIKey"], async (storage) => {
            var apiKey = storage.steamAPIKey;
            var accessToken = JSON.parse(document.getElementById("application_config").getAttribute("data-loyalty_webapi_token"))

            await injectTradeOffersToDomFromAPI(accessToken, apiKey);

        });

        me.disconnect(); // stop observing
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});


async function injectTradeOffersToDomFromAPI(accessToken, apiKey) {
    if (apiKey === undefined) {
        //Wait Till dom is builed
        setTimeout(() => {
            displayAPIKeyInput();
        }, 500)

        return;
    }

    const tradeOfferRequest = new Request(`https://api.steampowered.com/IEconService/GetTradeOffers/v1/?get_descriptions=1&active_only=1&get_received_offers=1&get_sent_offers=1&access_token=${accessToken}`);

    let tradeOfferData = await fetch(tradeOfferRequest)
        .then(response => {
            if (response.status === 403) {
                displayAPIKeyWrong();
                return;
            } else if (!response.ok) {
                console.log("Not ok" + response.status)
                displayAPIError();
                return;
            }
            return response.json()
        })
        .then(data => {
            return data;
        });
    if (!tradeOfferData) {
        displayAPIError();
        return;
    }

    const tradeOffers = tradeOfferData.response.trade_offers_received;
    const descriptions = tradeOfferData.response.descriptions;
    let tradeOfferSpace = document.createElement("div");
    tradeOfferSpace.className = "profile_leftcol";
    document.getElementsByClassName("maincontent")[0].style.overflow = "auto";
    document.getElementsByClassName("maincontent")[0].appendChild(tradeOfferSpace);

    let profileDataRequestUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=`

    for (let tradeoffer in tradeOffers) {
        let currentOffer = tradeOffers[tradeoffer];
        profileDataRequestUrl += steamId3ToSteamid64(currentOffer.accountid_other) + ",";
    }

    const profileDataRequest = new Request(profileDataRequestUrl);

    let profileData = await fetch(profileDataRequest).then(response => {
        if (response.status === 403) {
            displayAPIKeyWrong();
            return;
        } else if (!response.ok) {
            console.log("Not ok" + response.status)
            displayAPIError();
            return;
        }
        return response.json()
    }).then(data => {
        return data;
    });

    if (!profileData) {
        displayAPIError();
        return;
    }

    let errors = 0;

    for (let tradeoffer in tradeOffers) {
        let currentOffer = tradeOffers[tradeoffer];

        let itemsReceived = (currentOffer.items_to_receive) ? currentOffer.items_to_receive.length : 0;
        let itemsGiven = (currentOffer.items_to_give) ? currentOffer.items_to_give.length : 0;
        if((itemsGiven + itemsReceived) === 0){
            errors++;
            continue;
        }
        tradeOfferSpace.appendChild(buildTradeOfferElement(currentOffer, descriptions, profileData.response.players));
        let tradeOfferSpacer = document.createElement("div");
        tradeOfferSpacer.className = "tradeoffer_rule";
        tradeOfferSpace.appendChild(tradeOfferSpacer);
    }

    document.getElementById("mainContents").remove();

    let spacer = document.createElement("div");
    spacer.style.clear = "both";
    tradeOfferSpace.appendChild(spacer);

    let right_col = document.createElement("div");
    right_col.className = "profile_rightcol"

    let amountReceived = (tradeOfferData.response.trade_offers_received) ? tradeOfferData.response.trade_offers_received.length : 0;
    let amountSent = (tradeOfferData.response.trade_offers_sent) ? tradeOfferData.response.trade_offers_sent.length : 0;

    right_col.innerHTML = getRightProfileColHtml(amountReceived, amountSent);

    let warningApiLoading = document.createElement("h3");
    warningApiLoading.innerText = "Warning the TradeOffers got loaded via FixTradeoffers Extension. Display errors may occur. Other Extensions might wont work!"
    warningApiLoading.style.color = "orange";
    warningApiLoading.style.textAlign = "center";

    if(errors > 0){
        let warningErrors = document.createElement("h2");
        warningErrors.innerText = (errors > 1 ) ? errors + " TradeOffers couldn't be loaded and are not displayed" : "1 TradeOffer couldn't be loaded and is not displayed";
        warningErrors.style.color = "red";
        warningErrors.style.textAlign = "center";

        document.getElementsByClassName("maincontent")[0].appendChild(warningErrors);
    }
    document.getElementsByClassName("maincontent")[0].appendChild(warningApiLoading);
    document.getElementsByClassName("maincontent")[0].appendChild(right_col);
    document.getElementsByClassName("maincontent")[0].appendChild(tradeOfferSpace);

}

function displayAPIKeyInput() {
    let tradeOfferSpace = document.getElementById("mainContents");

    let title = document.createElement("h2");
    title.innerText = "This extension can load your tradeoffer with your apikey + session Token.";
    title.style.textAlign = "center";
    let disclaimer = document.createElement("h3");
    disclaimer.style.color = "red";
    disclaimer.innerHTML =
        "<br> Always make sure to double check the tradeoffer in the actual tradeoffer window (when you click on one)." +
        "<br> Use at your own risk. I dont guarantee that there are no display errors." +
        "<br> When setting your apikey you agree and confirm that you have read the text above."
    disclaimer.style.textAlign = "center";

    let div = document.createElement("div");
    div.style.margin = "0 auto";
    div.style.width = "100%";
    div.style.textAlign = "center";

    let label = document.createElement("a");
    label.innerText = "Get your Steam API Key here"
    label.setAttribute("href", "https://steamcommunity.com/dev/apikey");
    label.setAttribute("target", "_blank");
    let inputField = document.createElement("input");
    inputField.id = "steamapikey";
    inputField.defaultValue = "APIKey";
    let button = document.createElement("button");
    button.innerText = "Save APIKey";
    button.onclick = function saveAPIKey() {
        chrome.storage.local.set({steamAPIKey: document.getElementById("steamapikey").value}, function () {
            location.reload();
        });
    };
    tradeOfferSpace.appendChild(title);
    tradeOfferSpace.appendChild(disclaimer);
    div.appendChild(label);
    div.appendChild(inputField);
    div.appendChild(button);
    tradeOfferSpace.appendChild(div);
}

function displayAPIKeyWrong() {
    let tradeOfferSpace = document.getElementById("mainContents");

    let title = document.createElement("h1");
    title.innerText = "Your access token/apikey is invalid or expired. Try to refresh the page.";
    title.style.textAlign = "center";
    tradeOfferSpace.appendChild(title);
    displayAPIKeyInput();
}

function displayAPIError() {
    let tradeOfferSpace = document.getElementById("mainContents");

    let title = document.createElement("h1");
    title.innerText = "Failed to load tradeoffers from the steamapi. Try again later";
    title.style.textAlign = "center";
    tradeOfferSpace.appendChild(title);
}


function appendItems(itemHolder, items, descriptions) {
    if (items !== undefined) {
        for (let i = 0; i < items.length; i++) {
            let currentItem = items[i];
            let currentDescription = findDescriptionByClassIdAndInstanceIdAndAppId(descriptions, currentItem.classid, currentItem.instanceid, currentItem.appid);
            let itemElement = document.createElement("div");
            itemElement.className = "trade_item";
            itemElement.style.borderColor = "#" + currentDescription.name_color;
            itemElement.setAttribute("data-economy-item", `classinfo/${currentItem.appid}/${currentItem.classid}/${currentItem.instanceid}`)
            let imageElement = document.createElement("img");
            imageElement.src = iconUrlPrefix + currentDescription.icon_url + iconResSuffix;
            itemElement.appendChild(imageElement);
            itemHolder.appendChild(itemElement);
        }
    }
    let itemSpacer = document.createElement("div");
    itemSpacer.style.clear = "left";
    itemHolder.appendChild(itemSpacer);
}

function buildTradeOfferElement(tradeoffer, descriptions, profileData) {
    let tradeOfferElement = document.createElement("div");
    tradeOfferElement.className = "tradeoffer";
    tradeOfferElement.id = "tradeofferid_" + tradeoffer.tradeofferid;
    tradeOfferElement.innerHTML = tradeOfferWithoutItems(tradeoffer, profileData);

    if (tradeoffer.message) {
        let messageElement = tradeOfferElement.getElementsByClassName("tradeoffer_message")[0];

        let quote_arrow = document.createElement("div");
        quote_arrow.className = "quote_arrow";
        messageElement.appendChild(quote_arrow);

        let quote = document.createElement("div");
        quote.className = "quote";
        quote.innerText = tradeoffer.message;
        messageElement.appendChild(quote);
    }

    let otherItems = tradeOfferElement.getElementsByClassName("tradeoffer_items primary")[0].getElementsByClassName("tradeoffer_item_list")[0];
    appendItems(otherItems, tradeoffer.items_to_receive, descriptions);

    let myItems = tradeOfferElement.getElementsByClassName("tradeoffer_items secondary")[0].getElementsByClassName("tradeoffer_item_list")[0];
    appendItems(myItems, tradeoffer.items_to_give, descriptions);

    return tradeOfferElement;
}

function tradeOfferWithoutItems(tradeoffer, profileData) {
    let steamid3 = tradeoffer.accountid_other;
    let steamid64 = steamId3ToSteamid64(steamid3);
    let profile = findProfileBySteamId64(steamid64, profileData);
    let profileAndBorderImage = document.getElementsByClassName("playerAvatar medium")[0].getElementsByTagName("img");
    let profilePictureUrl = profileAndBorderImage[profileAndBorderImage.length - 1].src;
    return ` <a href="#" onclick="ReportTradeScam( '${steamid64}',profile.personaname );" class="btn_grey_grey btn_medium ico_hover btn_report" title="Flag this as a suspected scam.">
        <span><i class="ico16 report"></i></span>
    </a>
    <div class="tradeoffer_partner">
        <div class="playerAvatar online" data-miniprofile="${steamid3}">
            <a href="https://steamcommunity.com/profiles/${steamid64}">
                <img src="${profile.avatar}">
            </a>
        </div>
    </div>
    <div class="tradeoffer_header">
       ${profile.personaname} offered you a trade:</div>
    <div class="tradeoffer_message"></div>
    <div class="tradeoffer_items_ctn  active">
        <div class="link_overlay" onclick="ShowTradeOffer( '${tradeoffer.tradeofferid}' );"></div>
        <div class="tradeoffer_items primary">
            <div class="tradeoffer_items_avatar_ctn">
                <a class="tradeoffer_avatar playerAvatar tiny online" href="https://steamcommunity.com/profiles/${steamid64}" data-miniprofile="${steamid3}">
                    <img src="${profile.avatar}">
                </a>
            </div>
            <div class="tradeoffer_items_header">
               ${profile.personaname} offered:</div>
            <div class="tradeoffer_item_list">
            </div>
        </div>
        <div class="tradeoffer_items_rule"></div>
        <div class="tradeoffer_items secondary">
            <div class="tradeoffer_items_avatar_ctn">
                <a class="tradeoffer_avatar playerAvatar tiny online" href="https://steamcommunity.com/my" data-miniprofile="rip">
                    <img src="${profilePictureUrl}">
                </a>
            </div>
            <div class="tradeoffer_items_header">
                For your:</div>
            <div class="tradeoffer_item_list">
                
            </div>
        </div>
    </div>
    <div class="tradeoffer_footer">
        <div class="tradeoffer_footer_actions">
            <a href="javascript:ShowTradeOffer( '${tradeoffer.tradeofferid}' );" class="whiteLink">Respond to Offer</a>
            |
            <a href="javascript:ShowTradeOffer( '${tradeoffer.tradeofferid}' );" class="whiteLink">Decline Trade</a>
        </div>
        Offer expires at ${timeConverter(tradeoffer.expiration_time)}<div style="clear: right;"></div>
    </div>`
}

function getRightProfileColHtml(tradeOffersReceived, tradeOffersSent) {
    return ` <div class="responsive_local_menu">
        <div class="rightcol_controls">
            <div class="rightcol_controls_content">
                <div class="btn_darkblue_white_innerfade btn_medium new_trade_offer_btn responsive_OnClickDismissMenu" onclick="ShowFriendSelect( 'New Trade Offer...', StartTradeOffer );"><span>New Trade Offer...</span></div>
            </div>
            <div class="rightcol_controls_rule"></div>
            <div class="rightcol_controls_content">
                <a class="right_controls_large_block" href="https://steamcommunity.com/my/tradeoffers/">
                    <div class="right_controls_large_block_active_bg"></div>
                    <div class="title">Incoming Offers</div>
                    <div class="secondary">
                        (${tradeOffersReceived} Pending)
                    </div>
                </a>
                <div class="rightcol_controls_secondary_link_ctn">
                    <a class="right_controls_secondary_link " href="https://steamcommunity.com/my/tradeoffers/?history=1">
                        Incoming Offer History</a>
                </div>
            </div>
            <div class="rightcol_controls_rule"></div>
            <div class="rightcol_controls_content">
                <a class="right_controls_large_block" href="https://steamcommunity.com/my/tradeoffers/sent/">
                    <div class="title">Sent Offers</div>
                    <div class="secondary">
                        (${tradeOffersSent} Pending)
                    </div>
                </a>
                <div class="rightcol_controls_secondary_link_ctn">
                    <a class="right_controls_secondary_link " href="https://steamcommunity.com/my/tradeoffers/sent/?history=1">
                        Sent Offer History</a>
                </div>
            </div>
            <div class="rightcol_controls_rule"></div>
            <div class="rightcol_controls_content">
                <a class="whiteLink" href="https://steamcommunity.com/my/tradehistory/">View Trade History</a>
            </div>
            <div class="rightcol_controls_rule"></div>
            <div class="rightcol_controls_content">
                <div class="rightcol_controls_secondary_link_ctn">
                    <a class="whiteLink" href="https://steamcommunity.com/my/tradeoffers/privacy">
                        Who can send me Trade Offers?</a>
                </div>
            </div>
            <div class="rightcol_controls_rule"></div>
            <div class="rightcol_controls_content">
                <div class="rightcol_controls_secondary_link_ctn">
                    <a class="whiteLink" href="https://steamcommunity.com/my/tradeoffers/tradetopics">
                        Trading Topics</a>
                </div>
            </div>
        </div>
        <br>
        <div class="rightcol_controls">
            <div class="rightcol_controls_content">
                <a class="whiteLink" href="https://support.steampowered.com/kb_article.php?ref=2178-QGJV-0708" target="_blank" rel="noreferrer">Frequently Asked Questions</a>
            </div>
        </div>
        </div>`
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(   UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();

    var time = date + ' ' + month + ' ' + year + ' ';
    return time;
}

function steamId3ToSteamid64(steamid3) {
    let base = BigInt(76561197960265728);
    return base + BigInt(parseInt(steamid3));
}

function findDescriptionByClassIdAndInstanceIdAndAppId(descriptions, classid, instanceid, appid) {
    for (let description in descriptions) {
        let currentDescription = descriptions[description];
        if (currentDescription.appid === appid && currentDescription.classid === classid && currentDescription.instanceid === instanceid) {
            return currentDescription;
        }
    }
}

function findProfileBySteamId64(steamid64, profiles) {
    for (let profile in profiles) {
        let currentProfile = profiles[profile];
        if (currentProfile.steamid === steamid64 + "") {
            return currentProfile;
        }
    }
}
