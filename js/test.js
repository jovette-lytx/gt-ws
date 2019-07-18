
geotab.addin.request = (elt, service) => {
    elt.innerHTML = `
            <div class="addin">
            <fieldset>
                    <div class="addin_row">
                        <label for="addin_type">Type: </label>
                        <select id="addin_type">
                            <option value="zoneMenu">Zone</option>
                            <option value="vehicleMenu">Device</option>
                            <option value="routeMenu">Route</option>
                            <option value="mapMenu">Map</option>
                            <option value="historyTripsMenu">History trip</option>
                        </select>
                    </div>
                    <div class="addin_row">
                        <label for="addin_name">Title: </label>
                        <input type="text" class="addin_field" id="addin_name">
                    </div>
                    <div class="addin_row">
                        <label for="addin_text">Index: </label>
                        <input type="number" class="addin_field" id="addin_index" value="1">
                    </div>
                    <div class="addin_row">
                        <label for="addin_text">Data: </label>
                        <input type="text" class="addin_field" id="addin_text">
                    </div>
            </fieldset>
        </div>`
}
