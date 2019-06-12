const dataController = (() => {

    const threshold = 1095;

    const TimeIn = function(id, type, startDate, endDate){
      this.id = id;
      this.type = type;
      this.startDate = Date.parse(startDate);
      this.endDate = Date.parse(endDate);
      this.days = Date.parse(endDate) - Date.parse(startDate);
    };

    const TimeOut = function(id, type, startDate, endDate){
      this.id = id;
      this.type = type;
      this.startDate = Date.parse(startDate);
      this.endDate = Date.parse(endDate);
      this.days = Date.parse(endDate) - Date.parse(startDate);
    };

    let data = {
      all: {
        in: [],
        out: [],

      },
      days: {
        in: 0,
        out: 0
      },
      total: 0
    };

    const daysCalculator = type => {
      let sum = 0;
      data.all[type].forEach(el => {
        sum += el.days;
      });
      data.days[type] = sum / (60*60*24*1000);
    };

    return {

      addItem: entry => {
          data.all[entry.type].push(entry);
          return entry;
      },

      createItem: (type, start, end) => {
          let newItem, ID;

          if(data.all[type].length > 0){
            ID = data.all[type][data.all[type].length - 1].id + 1;
          }else{
            ID = 0;
          }


          if(type === 'in'){
             newItem = new TimeIn(ID, type, start, end);
          } else if (type === 'out'){
            newItem = new TimeOut(ID, type, start, end);
          }

          data.all[type].push(newItem);
          return newItem;

      },

      deleteItem: (type, id) => {
        let ids, index;

        ids = data.all[type].map((el,index) => {
          return el.id;
        });

        index = ids.indexOf(id);

        if(index !== -1){
          data.all[type].splice(index, 1);
        }
      },

      calculateDays: () => {
        //sum days in and out
        daysCalculator('in');
        daysCalculator('out');

        //calcul total days left
        data.total = (data.days['in'] === 0 ? threshold : threshold - (data.days['in'] - data.days['out']));
      },

      getDays: () => {
        return {
          total: data.total,
          totalIn: data.days['in'],
          totalOut: data.days['out']
        }
      },

      testing: () => {
        console.log(data);
      }
    };

})();

const uIController = (() => {

  let DOMelements = {
    remain: '.remainDays',
    inDays: '.inDays',
    add: '.addBtn',
    type: '.addType',
    wp: '.addWP',
    start: '.startDate',
    end: '.endDate',
    inContainer: '.timein_list',
    outContainer: '.timeout_list',
    dataContainer: '.dataContent'
  }

  return {
    getInput: () => {
      return {
        type: document.querySelector(DOMelements.type).value,
        startDate: document.querySelector(DOMelements.start).value,
        endDate: document.querySelector(DOMelements.end).value
      }
    },
    addItemToDOM: (obj, type) => {
      let html, newHtml, element, fields, fieldsArr, dateIn, dateOut;
      //create HTML string with placeholder
      if(type === 'in'){
          element = DOMelements.inContainer;
          html = '<div class="item" id="in-%id%"><div class="item_start">%start%</div><div class="item_end">%end%</div><div class="right clearfix"><div class="item__delete"><button class="item__delete--btn">x</button></div></div></div>';
      } else if(type === 'out'){
          element = DOMelements.outContainer;
          html = '<div class="item" id="out-%id%"><div class="item_start">%start%</div><div class="item_end">%end%</div><div class="right clearfix"><div class="item__delete"><button class="item__delete--btn">x</i></button></div></div></div>';
      }

      dateIn = new Date(obj.startDate);
      dateOut = new Date(obj.endDate);

      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%start%', new Intl.DateTimeFormat().format(dateIn));
      newHtml = newHtml.replace('%end%', new Intl.DateTimeFormat().format(dateOut));

      document.querySelector(element).insertAdjacentHTML('afterbegin', newHtml);

    },

    deleteItemFromDOM: id => {
      let el = document.getElementById(id);
      el.parentNode.removeChild(el);
    },

    clearFields: () => {
      fields = document.querySelectorAll(DOMelements.start + ', ' + DOMelements.end);
      fieldsArr = Array.prototype.slice.call(fields);
      fieldsArr.forEach(el => {
        el.value = '';
      });

    },

    displayData: obj => {
      document.querySelector(DOMelements.remain).textContent = obj.total;
      document.querySelector(DOMelements.inDays).textContent = obj.totalIn;
    },

    getDOMelements: () => {
      return DOMelements;
    }
  };

})();

const appController = ((dataCtrl,uICtrl) => {


  const initEventListeners = () => {
    let DOM = uICtrl.getDOMelements();

    document.querySelector(DOM.add).addEventListener('click', addEntry);
    document.querySelector(DOM.type).addEventListener('change', toggleWP);

    document.addEventListener('keypress', e => {
      if(e.keyCode === 13 || e.which === 13){
        addEntry();
      }
    });

    document.querySelector(DOM.dataContainer).addEventListener('click', deleteItems);

  };

  const initData = async () => {
    try{
      const response = await fetch('https://5cfdae53ca949b00148d3894.mockapi.io/api/v1/data/');
      const data = await response.json();
      return data;
    }catch(e){
      console.log(e);
    }
  }

  const toggleWP = () => {
    let DOM = uICtrl.getDOMelements();
    if(document.querySelector(DOM.type).value === 'out'){
      document.querySelector(DOM.wp).classList.add('hide');
    }else{
      document.querySelector(DOM.wp).classList.remove('hide');
    }
  }

  const updateCalcul = () => {
    //Calculate days
    dataCtrl.calculateDays();

    //Return the new calcul
     let data = dataCtrl.getDays();

    //Display new calcul
    uICtrl.displayData(data);
  };

  const addEntry = () => {
    let input, newEntry;
    //Gather input data
    input = uICtrl.getInput();

    if(input.startDate !== '' && input.endDate !== ''){
      //Add the data to the data Controller
      newEntry = dataCtrl.createItem(input.type,input.startDate,input.endDate);

      //Add to the UI and clear fileds
      uICtrl.addItemToDOM(newEntry, input.type);
      uICtrl.clearFields();

      //Call updatecalcul methold
      updateCalcul();
    }

  };

  const deleteItems = e => {
    let elementId, splitId, type, ID;

    elementId = e.target.parentNode.parentNode.parentNode.id;

    if(elementId){

      splitId = elementId.split('-');
      type = splitId[0];
      ID = parseInt(splitId[1]);

      //delete item from data
      dataCtrl.deleteItem(type, ID);

      //delete from the ui
      uICtrl.deleteItemFromDOM(elementId);

      //update new total
      updateCalcul();
    }
  }

  return {
    init: () => {
      initEventListeners();

      //display data
      initData()
      .then(data => {
        if(data !== ""){

          dataCtrl.addItem(data);
          uICtrl.addItemToDOM(data, data.type);

          updateCalcul();
        }
      })
      .catch(e => {
        console.log(e);
      });
    }
  };

})(dataController,uIController);

appController.init();
