geotab.addin.lytxTripsAction = (elt, service) => {

    let storeTripTimestamp = (event, data) => {
        if (event === "over") {
            service.localStorage.set("onClickTripTimestamp", data.entity.dateTime);
        }
    }
    
    // subscribe to any mouseover events. Will be fired when user pointer over: device, zone, route.
    // e parameter looks like: {"type":"zone","entity":{"id":"b3C3F"}}
    service.events.attach('over', (e) => { storeTripTimestamp('over', e); });

    elt.innerHTML = `<div class="lytxTripsAction">Lytx Trips Histotry Action Menu</div>`;

        let attach = () => {

            // actionList attaches to some map popup menus: zone, route, device, map etc.
            // callback will be called if MyGeotab is about to show particular menu
            service.actionList.attachMenu("historyTripsMenu", (...rest) => {
                console.log(rest);
                
                service.localStorage.get("onClickTripTimestamp").then((timestamp) => {
                
                  // if you want to add new buttons to this menu, just return array of them
                  // if you don't want to show something, just return an empty array
                  return "Browse Lytx Video" ? Promise.resolve([{
                      title: "Browse Lytx Video", // title of the new button
                      clickEvent: "Clicked", // event the will be fired when user clicks on button
                      zIndex: 1, // zInxed for button in menu, to control where it should be places
                      data: { data: timestamp || "" } // some data that you need when user clicks on button
                  }]) : [];
                  
                });
            });
        }

        let prev = "historyTripsMenu";
        attach();

        // subscribe to events when new button is clicked by user
        service.actionList.attach("Clicked", data => {
            // data here is something that you pass with "data" property in new button options
            console.log(JSON.stringify(data));
        });
};
