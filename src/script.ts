//Show  templates into window
//It has Most Common Elements And access dom elements
abstract class BasicElements<T extends HTMLElement,U extends HTMLElement> {
  Template: HTMLTemplateElement; //template 
  Host: T; /// host which contains the element
  element: U; // the actual element we want modify 
  where: InsertPosition; //Its helps th indiacate where we append element to host
  constructor(template: string,host: string,where: InsertPosition) {
    this.Template = document.getElementById(template)! as HTMLTemplateElement;
    this.Host = document.getElementById(host)! as T;
    const importedNode = document.importNode(this.Template.content,true); // As we see this imported node will htmlfragments 
    this.element = importedNode.firstElementChild as U;
    this.where = where;

    this.attach(); //attaches element to host
  }

  attach(){//attaches element to the host
    this.Host.insertAdjacentElement(this.where, this.element);
  }

  abstract configure(): void;
}


//enum for Status updates
enum Status{
  Live = 'active',
  Dead = 'finished'
}

//project Template data
interface Projects{
  title: string,
  desc: string,
  people: string,
  status: Status,
  id?: string
}


//localstorage setup
class Store {
  Storage: Storage; //actual localstorage we want to operate

  constructor (){
    this.Storage = localStorage; //give access localstorage to this.Storage
  }

  AddStorage(id: string,data: Projects){// it adds Project into localStorage with id: {} format
    const DataCon = JSON.stringify(data);//every data in local storage is stringified objects
    this.Storage.setItem(id, DataCon);//add item into localstorage
  }

  RemoveStorage(id: string){//removes item from localstorage
    this.Storage.removeItem(id);
  }

  UpdateStorage(id: string,status: Status){//every time list dropped to different place then this will chage the status of that list
    const Value: Projects = JSON.parse(this.Storage.getItem(id)!);
    Value.status = status;
    this.AddStorage(id, Value);//afterchange we add changes inges into localstorage
  }

//its helps to load localStorage data on website loading
  FetchElements(){//every time website onload this will add item to boxes respectively with their status
    for (const key in this.Storage) {//access every objects in localStorage
      if (Number.isInteger(+key)) { // checks for is id is number here we can also add key.length == 13 thats also works
        const Elem: Projects = JSON.parse(this.Storage[key]);
        if (Elem.id) { //its not neccasary its helpfull it checks existance of elem.id 
          ProjectStates.AddListElement(Elem.title, Elem.desc, Elem.people, Elem.status, 'fetch',Elem.id); //** this line adds the localStorage list data into the boxes 
        }
      }
      
    }
  }
}

const LocalStorage = new Store(); // assigns localStorage class to variable LocalStorage



//State listener Function manager
type Listening = (array: Projects[]) => void; // its an type of function that takes arrays that contains project types as a input and doesn't return anything


//State management
class State {
  AllListData: Projects[] = []; // every time the instance works on this state this array will store every on of the project details
  AllStateListeners: Listening[] = [] // this array contains Functio
  

//this function takes data we're inputted after that it pushes that data into AllListData array as a type of Projects objects  
  AddListElement(title: string, desc: string, people: string, status: Status,fetch?: 'fetch',id?: string) {
    const ListElem: Projects = {title: title,desc: desc,people: people, status: status,id: id}
    if (fetch!== 'fetch') { //if We're on loading then will to stop these because of this will chage data of projects and copies of them in LocalStorage
      //normally its helps to add id and add Project objects into localstorage
      ListElem.id = new Date().getTime().toString();
      LocalStorage.AddStorage(ListElem.id, ListElem);
    }
    this.AllListData.push(ListElem);
    this.ExecuteListeners();
  }

  AddListener(Fun: Listening): void { //it pushes functions into Arrays
    this.AllStateListeners.push(Fun);
  }

  MoveListElements(id: string, UlElem: HTMLUListElement): void{ //this is helpfull for dropped element in different boxes 
    //checks every objects in the array and find one object we want to chage status of that
    //adds that changes into localstorage
    this.AllListData.find((list: Projects) => {
      if (list.id == id) {
        list.status = UlElem.id== 'active' ? Status.Live : Status.Dead;
        LocalStorage.UpdateStorage(id, list.status)
      }
    })
    this.ExecuteListeners(); //after every changes it will rerender all projects and lists  
  }

  DeleteItem(id: string): void{ //deletes item in boxes and also in LocalStorage
    const DeletedArray = this.AllListData.filter((list) => {
      if (list.id == id) {
        return false;
      }
      return true;
    });
    this.AllListData = DeletedArray
  }

  ExecuteListeners(): void{ //it execute all functions in AllStateListeners array with the parameter of Projects Object in AllListData array
    for (const listeningFN of this.AllStateListeners) {
      const CopyOfAllProjects = this.AllListData.slice(); //this will creates an copy
      listeningFN(CopyOfAllProjects)
      
    }
  }



}

const ProjectStates = new State(); //its an instance of store that has only one instance


//its responsible for every single project list creation 
class ProjectListItemGenerator extends BasicElements<HTMLUListElement,HTMLLIElement> {
  AssignedProject: Projects; // This is an copy of Project object
  DeleteButton: HTMLSpanElement; // the delete element
  EditButton: HTMLSpanElement; // thé edit button

  constructor(host: string,Project: Projects) {
    super('single_project',host,'beforeend'); // access parent element constructor
    this.EditButton = this.element.querySelector('#Write')! as HTMLSpanElement; // access edit button
    this.DeleteButton = this.element.querySelector('#delete')! as HTMLSpanElement; // access delete button
    this.AssignedProject = Project; // assigns Project data into AssignedProject
    this.element.id = this.AssignedProject.id as string; //set id to list elements
    this.RenderInnerData(); //sets the innertext of h2,h3,p
    this.configure(); // watching for event triggers
  }

  configure(): void { //checks for user actions
    this.element.addEventListener('dragstart', this.DragStart.bind(this)); 
    this.EditButton.addEventListener('click', this.EditEvent.bind(this));
    this.DeleteButton.addEventListener('click', this.DeleteEvent.bind(this));
  }



  RenderInnerData(): void{ // this assigns value into inner li elements that are h2,h3,p
    const persons = (+this.AssignedProject.people == 1)? 'Person' : 'Persons';
    this.element.querySelector('h2')!.innerText = this.AssignedProject.title;
    this.element.querySelector('h3')!.innerText =`${ this.AssignedProject.people} ${persons} Assigned`;
    this.element.querySelector('p')!.innerText = this.AssignedProject.desc; 
  }

  DragStart(event: DragEvent): void { //it transfers the Project id into amother boxes for referencing that value in AllListData array and changes the status of that project object
    event.dataTransfer!.setData('text/plain',this.element.id)
    event.dataTransfer!.effectAllowed = 'move';
  }

  DeleteEvent(): void{ // deletes the element and removes thet element from AllListData and project details in LocalStorage
    LocalStorage.RemoveStorage(this.element.id);
    this.Host.removeChild(this.element);
    ProjectStates.DeleteItem(this.element.id);
  }

  EditEvent(): void{ // when an event button clicked then this will attaches Editor class to the body
    const edit = this.AssignedProject;
    editor.OnEditing(edit.title, edit.desc, edit.people,edit.status)
    editor.attach();
    this.DeleteEvent();
  }
}






//For active and finished projects
////its responsible for creating active and finished projects boxes
class SectionElements extends BasicElements<HTMLDivElement,HTMLElement> {
  type: string; // active or finished boxes
  Header: HTMLHeadElement; // access h2 element
  UnOrderedList: HTMLUListElement; //access ul 
  DragGenerate: number; //this will indicate the number of times dragover and dragleave

  constructor(template: string,host: string,where: InsertPosition,type: string) {
    super(template,host,where);
    this.type = type; 
    this.Header = this.element.querySelector('h2')! as HTMLHeadElement;
    this.UnOrderedList = this.element.querySelector('ul')! as HTMLUListElement;
    this.DragGenerate = 0;

    this.render(); //renders element heading
    this.configure(); //this adds functions into projectstate AllStateListeners
    this.EventHandler(); //manages all events
  }

  configure(): void {
    //this will add functions in to AllStateListeners
    //this function directly reference the the Ul container also
    ProjectStates.AddListener((Projects) => {
      this.UnOrderedList.innerHTML = '';
      for (const project of Projects) {
        if (project.status == this.type) {
          new ProjectListItemGenerator(this.type,project); //every time this function executes it will generate that amount of instance of ProjectListItemGenerator class with different value in Projects parameter that is AllListData array
        }
      }
    });

  }

  render(): void{ // renders h2 tag inner data
    this.Header.innerText = this.type.toUpperCase() + ' PROJECTS';
    this.UnOrderedList.id = this.type;
  }

  EventHandler(): void{ //checks for every drag and drop events
    this.element.addEventListener('dragover', this.DragOver.bind(this)); 
    this.element.addEventListener('dragleave', this.DragLeave.bind(this)); 
    this.element.addEventListener('drop', this.DropHandler.bind(this));
  }

  DragOver(event: DragEvent): void{
    this.DragGenerate++;
    if (event.dataTransfer && event.dataTransfer.types[0] == 'text/plain') {
    event.preventDefault();
    this.UnOrderedList.classList.add('dropable');
    }
    
  }

  DragLeave(): void{
    this.DragGenerate--;
    if (this.DragGenerate >= 0) {
      this.UnOrderedList.classList.remove('dropable');
    }
  }

  DropHandler(event: DragEvent){
    const id = event.dataTransfer!.getData('text/plain');
    this.UnOrderedList.classList.remove('dropable');
    ProjectStates.MoveListElements(id, this.UnOrderedList)
  }
}



//Form take Inputs
class FormElements extends BasicElements<HTMLDivElement,HTMLFormElement>{
  Tittle: HTMLInputElement;
  Description: HTMLInputElement;
  People: HTMLInputElement;
  constructor (template: string,host: string,where: InsertPosition){
    super(template,host,where);
    this.Tittle = document.getElementById('title')! as HTMLInputElement;
    this.Description = document.getElementById('description')! as HTMLInputElement;
    this.People = document.getElementById('people')! as HTMLInputElement;

    this.configure();
  }

  configure(): void { //event checks for submit
    this.element.addEventListener('submit', this.submittor.bind(this))
  }

  submittor(event: Event){ // execute after the submit
    event.preventDefault();
    this.validator();
  }

  validator(){ //validating values before submitting
    let isValid: boolean = false;
    if (typeof this.Tittle.value === 'string' && this.Tittle.value != '' && 
        typeof this.Description.value === 'string' && this.Description.value != '' && 
        this.People.value != '' && Number.isFinite(+this.People.value)) {
      if (+this.People.value > 0) {
        isValid = true;
      }
      else{
        alert('Enter Correct Number Of People');
      }
    }
    else{
      alert('Enter Correct Inputs');
    }
    if (isValid) {
      ProjectStates.AddListElement(this.Tittle.value, this.Description.value, this.People.value, Status.Live);
      this.clearInputs();
      alert('Successfully Added')
    }
    
  }


  clearInputs(){ //clears Input field after Submitted
    this.Tittle.value = '';
    this.Description.value = '';
    this.People.value = '';
  }
}


//Editor class for Editor button invokes when edit button is pressed
class Editor extends FormElements {
  OverLay: HTMLDivElement;
  status: Status;
  constructor(){
    super('form_template','app','afterbegin');
    this.element.id = 'EditorScreen';
    this.status = Status.Live;
    this.OverLay = document.createElement('div')! as HTMLDivElement;
    this.OverLay.id = 'EditorOverlay';
    console.log(this.OverLay);
    this.detach();
  }
  attach(){ //attaches to body
    document.body.append(this.element);
    if(this.OverLay){
      document.body.append(this.OverLay)
      this.openEditor();
    }
  }

  detach(){ //detaches from body
    document.body.removeChild(this.element);
  }
  submittor(event: Event){ //on submitting
    event.preventDefault();
    this.validator();
    this.closeEditor();
    this.detach();
  }
  validator(){ //validating values before submitting
    let isValid: boolean = false;
    if (typeof this.Tittle.value === 'string' && this.Tittle.value != '' && 
        typeof this.Description.value === 'string' && this.Description.value != '' && 
        this.People.value != '' && Number.isFinite(+this.People.value)) {
      if (+this.People.value > 0) {
        isValid = true;
      }
      else{
        alert('Enter Correct Number Of People');
      }
    }
    else{
      alert('Enter Correct Inputs');
    }
    if (isValid) {
      ProjectStates.AddListElement(this.Tittle.value, this.Description.value, this.People.value, this.status);
      this.clearInputs();
      alert('Successfully Added')
    }
    
  }
  
  OnEditing(tittle: string,desc: string,people: string,status: Status){
    this.Tittle.value = tittle;
    this.Description.value = desc;
    this.People.value = people;
    this.status = status;
  }

  openEditor() {
  this.OverLay.style.display = 'block';
}
  closeEditor() {
  this.OverLay.style.display = 'none';
  document.body.removeChild(this.OverLay);
}
}
const editor = new Editor;



const Form = new FormElements('form_template','app','afterbegin');

const ActiveProjects = new SectionElements('project_lists','app','beforeend','active')

const FinishedProjects = new SectionElements('project_lists','app','beforeend','finished')


LocalStorage.FetchElements();
