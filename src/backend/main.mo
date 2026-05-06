import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Error "mo:core/Error";
import Outcall "mo:caffeineai-http-outcalls/outcall";

actor {
  type Store = {
    id : Text;
    brand : Text;
    name : Text;
    status : Text;
    subscriptionType : Text;
    history : Text;
    telephony : Text;
    salesRep : Text;
    revenue : [Float];
    annualRevenue : Float;
    storeCode : Text;
  };

  type Task = {
    id : Nat;
    title : Text;
    description : Text;
    storeId : Text;
    status : Text;
    priority : Text;
    createdAt : Int;
    dueDate : Text;
  };

  module Store {
    public func compare(store1 : Store, store2 : Store) : Order.Order {
      Text.compare(store1.id, store2.id);
    };
  };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat.compare(task1.id, task2.id);
    };

    public func compareByCreatedAt(task1 : Task, task2 : Task) : Order.Order {
      Int.compare(task1.createdAt, task2.createdAt);
    };
  };

  // Persistent data structures
  let storeMap = Map.empty<Text, Store>();
  let taskMap = Map.empty<Nat, Task>();

  func seedStores() {
    if (storeMap.size() > 0) { return };
    let stores : [Store] = [
      {
        id = "PH001";
        brand = "Pizza Hub";
        name = "Pizza Hub Main St";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "John Doe";
        revenue = [10000.0, 12000.0, 11000.0, 13000.0, 14000.0, 15000.0, 16000.0, 17000.0, 18000.0, 19000.0, 20000.0, 21000.0];
        annualRevenue = 185000.0;
        storeCode = "PH-MS";
      },
      {
        id = "PH002";
        brand = "Pizza Hub";
        name = "Pizza Hub Oak St";
        status = "Inactive";
        subscriptionType = "Self Managed";
        history = "Average";
        telephony = "Enabled";
        salesRep = "John Doe";
        revenue = [9000.0, 9500.0, 9800.0, 10000.0, 11000.0, 11500.0, 12000.0, 12800.0, 13500.0, 14000.0, 14500.0, 15000.0];
        annualRevenue = 120000.0;
        storeCode = "PH-OS";
      },
      {
        id = "PH003";
        brand = "Pizza Hub";
        name = "Pizza Hub Downtown";
        status = "Pending";
        subscriptionType = "Limited Support";
        history = "Good";
        telephony = "Disabled";
        salesRep = "John Doe";
        revenue = [8000.0, 8300.0, 8500.0, 9000.0, 9500.0, 10500.0, 10800.0, 11200.0, 12000.0, 12500.0, 12800.0, 13000.0];
        annualRevenue = 90000.0;
        storeCode = "PH-DT";
      },
      {
        id = "BT001";
        brand = "Burger Tow";
        name = "Burger Tow 5th Ave";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Jane Smith";
        revenue = [12000.0, 13000.0, 14000.0, 14500.0, 15000.0, 15600.0, 16000.0, 16500.0, 17300.0, 18000.0, 18800.0, 19000.0];
        annualRevenue = 210000.0;
        storeCode = "BT-FA";
      },
      {
        id = "BT002";
        brand = "Burger Tow";
        name = "Burger Tow Central";
        status = "Inactive";
        subscriptionType = "Self Managed";
        history = "Disabled";
        telephony = "Disabled";
        salesRep = "Jane Smith";
        revenue = [7000.0, 7500.0, 7800.0, 8200.0, 8700.0, 9000.0, 9300.0, 9500.0, 9700.0, 9800.0, 10000.0, 10500.0];
        annualRevenue = 95000.0;
        storeCode = "BT-CEN";
      },
      {
        id = "BT003";
        brand = "Burger Tow";
        name = "Burger Tow North";
        status = "Active";
        subscriptionType = "Limited Support";
        history = "Average";
        telephony = "Enabled";
        salesRep = "Jane Smith";
        revenue = [10000.0, 10500.0, 11000.0, 11500.0, 12000.0, 12300.0, 12700.0, 13200.0, 13500.0, 14000.0, 14500.0, 15000.0];
        annualRevenue = 135000.0;
        storeCode = "BT-NTH";
      },
      {
        id = "CC001";
        brand = "Coffee Cor";
        name = "Coffee Cor Downtown";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Mike Johnson";
        revenue = [15000.0, 16000.0, 17000.0, 17500.0, 18000.0, 18500.0, 19000.0, 19500.0, 19800.0, 20000.0, 21000.0, 22000.0];
        annualRevenue = 235000.0;
        storeCode = "CC-DT";
      },
      {
        id = "CC002";
        brand = "Coffee Cor";
        name = "Coffee Cor Central";
        status = "Pending";
        subscriptionType = "Self Managed";
        history = "Average";
        telephony = "Disabled";
        salesRep = "Mike Johnson";
        revenue = [9000.0, 9500.0, 9800.0, 10500.0, 10800.0, 11300.0, 11600.0, 12000.0, 12800.0, 13200.0, 13800.0, 14000.0];
        annualRevenue = 125000.0;
        storeCode = "CC-CEN";
      },
      {
        id = "TF001";
        brand = "Taco Fiesta";
        name = "Taco Fiesta East";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Ana Garcia";
        revenue = [8500.0, 9000.0, 9500.0, 10000.0, 10500.0, 10700.0, 11300.0, 12000.0, 13000.0, 13500.0, 13800.0, 14000.0];
        annualRevenue = 120000.0;
        storeCode = "TF-EAST";
      },
      {
        id = "TF002";
        brand = "Taco Fiesta";
        name = "Taco Fiesta West";
        status = "Inactive";
        subscriptionType = "Self Managed";
        history = "Average";
        telephony = "Disabled";
        salesRep = "Ana Garcia";
        revenue = [9500.0, 9800.0, 10000.0, 10500.0, 11000.0, 11500.0, 11700.0, 12300.0, 13200.0, 14000.0, 14500.0, 15000.0];
        annualRevenue = 110000.0;
        storeCode = "TF-WEST";
      },
      {
        id = "TF003";
        brand = "Taco Fiesta";
        name = "Taco Fiesta Central";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Ana Garcia";
        revenue = [18000.0, 18500.0, 19000.0, 19300.0, 20000.0, 20500.0, 21000.0, 21500.0, 22000.0, 22500.0, 23000.0, 23500.0];
        annualRevenue = 215000.0;
        storeCode = "TF-CEN";
      },
      {
        id = "UB001";
        brand = "Urban Bite";
        name = "Urban Bite City Center";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Sara Lee";
        revenue = [20000.0, 21000.0, 22000.0, 22500.0, 23000.0, 23500.0, 24000.0, 25000.0, 26000.0, 27000.0, 28000.0, 29000.0];
        annualRevenue = 285000.0;
        storeCode = "UB-CC";
      },
      {
        id = "UB002";
        brand = "Urban Bite";
        name = "Urban Bite Suburb";
        status = "Inactive";
        subscriptionType = "Limited Support";
        history = "Average";
        telephony = "Disabled";
        salesRep = "Sara Lee";
        revenue = [9000.0, 9500.0, 10000.0, 10200.0, 10800.0, 11300.0, 11500.0, 12000.0, 12300.0, 12600.0, 13000.0, 13500.0];
        annualRevenue = 120000.0;
        storeCode = "UB-SUB";
      },
      {
        id = "UB003";
        brand = "Urban Bite";
        name = "Urban Bite Center";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Sara Lee";
        revenue = [15000.0, 15300.0, 16000.0, 16200.0, 16800.0, 17300.0, 17500.0, 18300.0, 19000.0, 19500.0, 20000.0, 20500.0];
        annualRevenue = 145000.0;
        storeCode = "UB-CEN";
      },
      // Add remaining stores for full 30 (14 total here)
      {
        id = "PH004";
        brand = "Pizza Hub";
        name = "Pizza Hub North";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "John Doe";
        revenue = [9000.0, 9200.0, 9300.0, 9500.0, 9600.0, 9700.0, 9800.0, 10000.0, 10200.0, 10500.0, 10800.0, 11200.0];
        annualRevenue = 110000.0;
        storeCode = "PH-NTH";
      },
      {
        id = "PH005";
        brand = "Pizza Hub";
        name = "Pizza Hub South";
        status = "Inactive";
        subscriptionType = "Self Managed";
        history = "Average";
        telephony = "Disabled";
        salesRep = "John Doe";
        revenue = [7000.0, 7200.0, 7300.0, 7500.0, 7600.0, 7800.0, 7900.0, 8000.0, 8100.0, 8200.0, 8300.0, 8500.0];
        annualRevenue = 95000.0;
        storeCode = "PH-STE";
      },
      {
        id = "PH006";
        brand = "Pizza Hub";
        name = "Pizza Hub East";
        status = "Pending";
        subscriptionType = "Limited Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "John Doe";
        revenue = [6500.0, 6700.0, 6900.0, 7000.0, 7200.0, 7300.0, 7400.0, 7500.0, 7600.0, 7700.0, 7800.0, 8000.0];
        annualRevenue = 89000.0;
        storeCode = "PH-OBH";
      },
      {
        id = "PH007";
        brand = "Pizza Hub";
        name = "Pizza Hub West";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "John Doe";
        revenue = [11000.0, 11300.0, 11600.0, 12000.0, 12300.0, 12700.0, 13000.0, 13300.0, 13600.0, 13700.0, 13900.0, 14200.0];
        annualRevenue = 105000.0;
        storeCode = "PH-TKJ";
      },
      {
        id = "BT004";
        brand = "Burger Tow";
        name = "Burger Tow Cultural";
        status = "Inactive";
        subscriptionType = "Self Managed";
        history = "Disabled";
        telephony = "Disabled";
        salesRep = "Jane Smith";
        revenue = [6500.0, 6800.0, 7000.0, 7100.0, 7350.0, 7400.0, 7600.0, 7700.0, 7850.0, 8000.0, 8300.0, 8300.0];
        annualRevenue = 89000.0;
        storeCode = "BT-CUL";
      },
      {
        id = "BT005";
        brand = "Burger Tow";
        name = "Burger Tow 5th Street";
        status = "Active";
        subscriptionType = "Limited Support";
        history = "Average";
        telephony = "Enabled";
        salesRep = "Jane Smith";
        revenue = [8100.0, 8400.0, 8600.0, 9000.0, 9300.0, 9500.0, 9600.0, 9900.0, 10200.0, 10500.0, 10800.0, 11200.0];
        annualRevenue = 160000.0;
        storeCode = "BT-5TH";
      },
      {
        id = "BT006";
        brand = "Burger Tow";
        name = "Burger Tow Rail Station";
        status = "Active";
        subscriptionType = "Self Managed";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Jane Smith";
        revenue = [11000.0, 11200.0, 11500.0, 11700.0, 12000.0, 12300.0, 12600.0, 12500.0, 12700.0, 12800.0, 13000.0, 13200.0];
        annualRevenue = 143000.0;
        storeCode = "BT-RST";
      },
      {
        id = "CC003";
        brand = "Coffee Cor";
        name = "Coffee Cor West";
        status = "Active";
        subscriptionType = "Limited Support";
        history = "Average";
        telephony = "Enabled";
        salesRep = "Mike Johnson";
        revenue = [8400.0, 8900.0, 9300.0, 9900.0, 10300.0, 10600.0, 11000.0, 11300.0, 11600.0, 11800.0, 12000.0, 12200.0];
        annualRevenue = 134000.0;
        storeCode = "CC-ACS";
      },
      {
        id = "CC004";
        brand = "Coffee Cor";
        name = "Coffee Cor East";
        status = "Pending";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Mike Johnson";
        revenue = [11000.0, 11300.0, 11600.0, 11900.0, 12000.0, 12300.0, 12500.0, 12800.0, 13100.0, 13400.0, 13600.0, 13900.0];
        annualRevenue = 162000.0;
        storeCode = "CC-TJD";
      },
      {
        id = "TF004";
        brand = "Taco Fiesta";
        name = "Taco Fiesta Ridge";
        status = "Active";
        subscriptionType = "Self Managed";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Ana Garcia";
        revenue = [9500.0, 9900.0, 10300.0, 10800.0, 11400.0, 11600.0, 11700.0, 11900.0, 12500.0, 12800.0, 13000.0, 13300.0];
        annualRevenue = 136000.0;
        storeCode = "TF-RDG";
      },
      {
        id = "TF005";
        brand = "Taco Fiesta";
        name = "Taco Fiesta Campus";
        status = "Inactive";
        subscriptionType = "Self Managed";
        history = "Average";
        telephony = "Disabled";
        salesRep = "Ana Garcia";
        revenue = [6000.0, 6400.0, 6600.0, 7000.0, 7200.0, 7300.0, 7400.0, 7100.0, 7300.0, 7500.0, 7700.0, 7800.0];
        annualRevenue = 78000.0;
        storeCode = "TF-CMP";
      },
      {
        id = "UB004";
        brand = "Urban Bite";
        name = "Urban Bite Lakeview";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Sara Lee";
        revenue = [12500.0, 12800.0, 13100.0, 13500.0, 13900.0, 14300.0, 14700.0, 15100.0, 15600.0, 15900.0, 16200.0, 16300.0];
        annualRevenue = 145000.0;
        storeCode = "UB-LAK";
      },
      {
        id = "UB005";
        brand = "Urban Bite";
        name = "Urban Bite Park ";
        status = "Inactive";
        subscriptionType = "Limited Support";
        history = "Average";
        telephony = "Disabled";
        salesRep = "Sara Lee";
        revenue = [8300.0, 8600.0, 8800.0, 9000.0, 9100.0, 9200.0, 9300.0, 9500.0, 9600.0, 9700.0, 9900.0, 10100.0];
        annualRevenue = 110000.0;
        storeCode = "UB-PARK";
      },
      {
        id = "UB006";
        brand = "Urban Bite";
        name = "Urban Bite Lounge";
        status = "Active";
        subscriptionType = "Full Support";
        history = "Good";
        telephony = "Enabled";
        salesRep = "Sara Lee";
        revenue = [13900.0, 14300.0, 14700.0, 15100.0, 15500.0, 15900.0, 16200.0, 16500.0, 17200.0, 17500.0, 18000.0, 18400.0];
        annualRevenue = 170000.0;
        storeCode = "UB-LOU";
      },
    ];

    for (store in stores.values()) {
      storeMap.add(store.id, store);
    };
  };

  // Seed data on initialization
  seedStores();

  public query func getStores() : async [Store] {
    storeMap.values().toArray().sort();
  };

  public query func getStoreById(id : Text) : async Store {
    switch (storeMap.get(id)) {
      case (null) { Runtime.trap("Store not found.") };
      case (?store) { store };
    };
  };

  public query func getStoresByBrand(brand : Text) : async [Store] {
    storeMap.values().toArray().filter(
      func(store) { store.brand == brand }
    ).sort();
  };

  public query func getStoresByStatus(status : Text) : async [Store] {
    storeMap.values().toArray().filter(
      func(store) { store.status == status }
    ).sort();
  };

  public query func getStoresBySubscription(subscriptionType : Text) : async [Store] {
    storeMap.values().toArray().filter(
      func(store) { store.subscriptionType == subscriptionType }
    ).sort();
  };

  /////////////////////////////// Task Functions ///////////////////////////////
  var nextTaskId = taskMap.size();

  public shared ({ caller }) func createTask(title : Text, description : Text, storeId : Text, priority : Text, dueDate : Text, createdAt : Int) : async () {
    let task : Task = {
      id = nextTaskId;
      title;
      description;
      storeId;
      status = "todo";
      priority;
      createdAt;
      dueDate;
    };
    taskMap.add(nextTaskId, task);
    nextTaskId += 1;
  };

  public shared ({ caller }) func updateTask(taskId : Nat, task : Task) : async () {
    if (not taskMap.containsKey(taskId)) { Runtime.trap("Task not found.") };
    taskMap.add(taskId, task);
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    taskMap.remove(taskId);
  };

  public query func getAllTasks() : async [Task] {
    taskMap.values().toArray().sort(Task.compareByCreatedAt);
  };

  public query func getTasksByStore(storeId : Text) : async [Task] {
    taskMap.values().toArray().filter(
      func(task) { task.storeId == storeId }
    ).sort(Task.compareByCreatedAt);
  };

  public query func getTasksByPriority(priority : Text) : async [Task] {
    taskMap.values().toArray().filter(
      func(task) { task.priority == priority }
    ).sort(Task.compareByCreatedAt);
  };

  public query func getTasksByStatus(status : Text) : async [Task] {
    taskMap.values().toArray().filter(
      func(task) { task.status == status }
    ).sort(Task.compareByCreatedAt);
  };

  /////////////////////////////// Google Sheets HTTP Outcall ///////////////////////////////

  // Strip-headers transform required by the IC HTTP outcall consensus mechanism
  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  // Extract the sheet ID from various Google Sheets URL formats
  // Matches: /spreadsheets/d/<ID>/  or  /spreadsheets/d/<ID>?
  func extractSheetId(url : Text) : ?Text {
    let parts = url.split(#char '/').toArray();
    var result : ?Text = null;
    var foundD = false;
    var done = false;
    for (part in parts.vals()) {
      if (not done) {
        if (foundD and part.size() > 10) {
          // Strip any query string from the ID
          let idParts = part.split(#char '?').toArray();
          result := ?idParts[0];
          done := true;
        };
        if (part == "d") { foundD := true };
      };
    };
    result;
  };

  public func fetchSheetCSV(sheetUrl : Text) : async { #ok : Text; #err : Text } {
    switch (extractSheetId(sheetUrl)) {
      case (null) {
        #err("Could not extract sheet ID from URL. Ensure the URL is a valid Google Sheets share link.");
      };
      case (?sheetId) {
        let csvUrl = "https://docs.google.com/spreadsheets/d/" # sheetId # "/export?format=csv";
        try {
          let csv = await Outcall.httpGetRequest(csvUrl, [], transform);
          #ok(csv);
        } catch (e) {
          #err("Failed to fetch sheet: " # e.message());
        };
      };
    };
  };
};
