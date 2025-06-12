"use strict";
class BasicElements {
    constructor(template, host, where) {
        this.Template = document.getElementById(template);
        this.Host = document.getElementById(host);
        const importedNode = document.importNode(this.Template.content, true);
        this.element = importedNode.firstElementChild;
        this.where = where;
        this.attach();
    }
    attach() {
        this.Host.insertAdjacentElement(this.where, this.element);
    }
}
var Status;
(function (Status) {
    Status["Live"] = "active";
    Status["Dead"] = "finished";
})(Status || (Status = {}));
class Store {
    constructor() {
        this.Storage = localStorage;
    }
    AddStorage(id, data) {
        const DataCon = JSON.stringify(data);
        this.Storage.setItem(id, DataCon);
    }
    RemoveStorage(id) {
        this.Storage.removeItem(id);
    }
    UpdateStorage(id, status) {
        const Value = JSON.parse(this.Storage.getItem(id));
        Value.status = status;
        this.AddStorage(id, Value);
    }
    FetchElements() {
        for (const key in this.Storage) {
            if (Number.isInteger(+key)) {
                const Elem = JSON.parse(this.Storage[key]);
                if (Elem.id) {
                    ProjectStates.AddListElement(Elem.title, Elem.desc, Elem.people, Elem.status, 'fetch', Elem.id);
                }
            }
        }
    }
}
const LocalStorage = new Store();
class State {
    constructor() {
        this.AllListData = [];
        this.AllStateListeners = [];
    }
    AddListElement(title, desc, people, status, fetch, id) {
        const ListElem = { title: title, desc: desc, people: people, status: status, id: id };
        if (fetch !== 'fetch') {
            ListElem.id = new Date().getTime().toString();
            LocalStorage.AddStorage(ListElem.id, ListElem);
        }
        this.AllListData.push(ListElem);
        this.ExecuteListeners();
    }
    AddListener(Fun) {
        this.AllStateListeners.push(Fun);
    }
    MoveListElements(id, UlElem) {
        this.AllListData.find((list) => {
            if (list.id == id) {
                list.status = UlElem.id == 'active' ? Status.Live : Status.Dead;
                LocalStorage.UpdateStorage(id, list.status);
            }
        });
        this.ExecuteListeners();
    }
    DeleteItem(id) {
        const DeletedArray = this.AllListData.filter((list) => {
            if (list.id == id) {
                return false;
            }
            return true;
        });
        this.AllListData = DeletedArray;
    }
    ExecuteListeners() {
        for (const listeningFN of this.AllStateListeners) {
            const CopyOfAllProjects = this.AllListData.slice();
            listeningFN(CopyOfAllProjects);
        }
    }
}
const ProjectStates = new State();
class ProjectListItemGenerator extends BasicElements {
    constructor(host, Project) {
        super('single_project', host, 'beforeend');
        this.EditButton = this.element.querySelector('#Write');
        this.DeleteButton = this.element.querySelector('#delete');
        this.AssignedProject = Project;
        this.element.id = this.AssignedProject.id;
        this.RenderInnerData();
        this.configure();
    }
    configure() {
        this.element.addEventListener('dragstart', this.DragStart.bind(this));
        this.EditButton.addEventListener('click', this.EditEvent.bind(this));
        this.DeleteButton.addEventListener('click', this.DeleteEvent.bind(this));
    }
    RenderInnerData() {
        const persons = (+this.AssignedProject.people == 1) ? 'Person' : 'Persons';
        this.element.querySelector('h2').innerText = this.AssignedProject.title;
        this.element.querySelector('h3').innerText = `${this.AssignedProject.people} ${persons} Assigned`;
        this.element.querySelector('p').innerText = this.AssignedProject.desc;
    }
    DragStart(event) {
        event.dataTransfer.setData('text/plain', this.element.id);
        event.dataTransfer.effectAllowed = 'move';
    }
    DeleteEvent() {
        LocalStorage.RemoveStorage(this.element.id);
        this.Host.removeChild(this.element);
        ProjectStates.DeleteItem(this.element.id);
    }
    EditEvent() {
        const edit = this.AssignedProject;
        editor.OnEditing(edit.title, edit.desc, edit.people, edit.status);
        editor.attach();
        this.DeleteEvent();
    }
}
class SectionElements extends BasicElements {
    constructor(template, host, where, type) {
        super(template, host, where);
        this.type = type;
        this.Header = this.element.querySelector('h2');
        this.UnOrderedList = this.element.querySelector('ul');
        this.DragGenerate = 0;
        this.render();
        this.configure();
        this.EventHandler();
    }
    configure() {
        ProjectStates.AddListener((Projects) => {
            this.UnOrderedList.innerHTML = '';
            for (const project of Projects) {
                if (project.status == this.type) {
                    new ProjectListItemGenerator(this.type, project);
                }
            }
        });
    }
    render() {
        this.Header.innerText = this.type.toUpperCase() + ' PROJECTS';
        this.UnOrderedList.id = this.type;
    }
    EventHandler() {
        this.element.addEventListener('dragover', this.DragOver.bind(this));
        this.element.addEventListener('dragleave', this.DragLeave.bind(this));
        this.element.addEventListener('drop', this.DropHandler.bind(this));
    }
    DragOver(event) {
        this.DragGenerate++;
        if (event.dataTransfer && event.dataTransfer.types[0] == 'text/plain') {
            event.preventDefault();
            this.UnOrderedList.classList.add('dropable');
        }
    }
    DragLeave() {
        this.DragGenerate--;
        if (this.DragGenerate >= 0) {
            this.UnOrderedList.classList.remove('dropable');
        }
    }
    DropHandler(event) {
        const id = event.dataTransfer.getData('text/plain');
        this.UnOrderedList.classList.remove('dropable');
        ProjectStates.MoveListElements(id, this.UnOrderedList);
    }
}
class FormElements extends BasicElements {
    constructor(template, host, where) {
        super(template, host, where);
        this.Tittle = document.getElementById('title');
        this.Description = document.getElementById('description');
        this.People = document.getElementById('people');
        this.configure();
    }
    configure() {
        this.element.addEventListener('submit', this.submittor.bind(this));
    }
    submittor(event) {
        event.preventDefault();
        this.validator();
    }
    validator() {
        let isValid = false;
        if (typeof this.Tittle.value === 'string' && this.Tittle.value != '' &&
            typeof this.Description.value === 'string' && this.Description.value != '' &&
            this.People.value != '' && Number.isFinite(+this.People.value)) {
            if (+this.People.value > 0) {
                isValid = true;
            }
            else {
                alert('Enter Correct Number Of People');
            }
        }
        else {
            alert('Enter Correct Inputs');
        }
        if (isValid) {
            ProjectStates.AddListElement(this.Tittle.value, this.Description.value, this.People.value, Status.Live);
            this.clearInputs();
            alert('Successfully Added');
        }
    }
    clearInputs() {
        this.Tittle.value = '';
        this.Description.value = '';
        this.People.value = '';
    }
}
class Editor extends FormElements {
    constructor() {
        super('form_template', 'app', 'afterbegin');
        this.element.id = 'EditorScreen';
        this.status = Status.Live;
        this.OverLay = document.createElement('div');
        this.OverLay.id = 'EditorOverlay';
        console.log(this.OverLay);
        this.detach();
    }
    attach() {
        document.body.append(this.element);
        if (this.OverLay) {
            document.body.append(this.OverLay);
            this.openEditor();
        }
    }
    detach() {
        document.body.removeChild(this.element);
    }
    submittor(event) {
        event.preventDefault();
        this.validator();
        this.closeEditor();
        this.detach();
    }
    validator() {
        let isValid = false;
        if (typeof this.Tittle.value === 'string' && this.Tittle.value != '' &&
            typeof this.Description.value === 'string' && this.Description.value != '' &&
            this.People.value != '' && Number.isFinite(+this.People.value)) {
            if (+this.People.value > 0) {
                isValid = true;
            }
            else {
                alert('Enter Correct Number Of People');
            }
        }
        else {
            alert('Enter Correct Inputs');
        }
        if (isValid) {
            ProjectStates.AddListElement(this.Tittle.value, this.Description.value, this.People.value, this.status);
            this.clearInputs();
            alert('Successfully Added');
        }
    }
    OnEditing(tittle, desc, people, status) {
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
const Form = new FormElements('form_template', 'app', 'afterbegin');
const ActiveProjects = new SectionElements('project_lists', 'app', 'beforeend', 'active');
const FinishedProjects = new SectionElements('project_lists', 'app', 'beforeend', 'finished');
LocalStorage.FetchElements();
//# sourceMappingURL=app.js.map
