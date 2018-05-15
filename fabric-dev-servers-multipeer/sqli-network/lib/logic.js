/**
 * Track the trade of a commodity from one trader to another
 * @param {org.example.sqlinetwork.UpdateBalance} update - house to update
 * @transaction
 */
function UpdateBalance(update) {
    update.house.balance = update.house.balance - update.qty;
    return getAssetRegistry('org.example.sqlinetwork.House')
        .then(function (assetRegistry) {
            return assetRegistry.update(update.house);
        });
}