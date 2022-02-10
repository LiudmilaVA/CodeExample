class CourierStep {
    constructor () {
        this.state = null;
        this.requiredSections = ["receiver", "package", "shipper", "agreement"];
    }

    isSectionFilled(sectionName) {
        if (!(sectionName in this.state)) {
            throw new Error('unknown section');
        }

        if (this.state[sectionName] === 'agreement') {
            return !!this.state[sectionName];
        }

        const isEveryFieldPresent = Object.values(this.state[sectionName]).every(this.filterEmptyCb);
        return isEveryFieldPresent;
    }

    getIsFilledState() {
        let res = {
            receiver: this.isSectionFilled('receiver'),
            package: this.isSectionFilled('package'),
            shipper: this.isSectionFilled('shipper'),
            isAllFilled: null
        };
        res.isAllFilled = res.receiver && res.package && res.shipper;
        return res;
    }

    isAgreementChecked() {
        return {
            agreement: this.isSectionFilled('agreement'),
        };
    }

    filterEmptyCb(val) {
        return val !== null && val !== "" && val !== false;
    }

    onChangeValue(sectionName, key, value) {
        this.state[sectionName][key] = value;
    }
}


class FormValidation {
    constructor () {
        this.state = null;
        this.container = document.querySelector('#courierForm');
        this.isValid = null;
        this.addressList = null;
    }

    init() {
        const inputsList = Array.from(this.container.querySelectorAll('input[data-validate]'));
        const that = this;
        let stepState = {};

        this.addressList = inputsList.filter(function (elem) {
            return $(elem).data('validate') === 'address';
        });

        inputsList.forEach(function (elem) {
            const inputType = $(elem).data('validate');
            const sect = $(elem).data('stepsection');
            const step = $(elem).data('stepkey');
            const $field = $(elem).closest('.courier-form_field--outer');

            // --- field is touched
            $(elem).attr('data-is-touched', false);

            if (!(sect in stepState)) {
                stepState[sect] = {};
            }
            stepState[sect][step] = null;

            // --- update on focus out
            $(elem).on('focusout', function (event) {
                if (!$(elem).data('is-touched')) $(elem).data('is-touched', true);
                that.updateValue(event, inputType, sect, step);
            });

            // --- update on key up
            $(elem).on('keyup', function (event) {
                if (inputType === 'address') {
                    $field.removeClass('is-valid');
                }

                if ($(elem).data('is-touched') || $field.hasClass('error')) {
                    that.updateValue(event, inputType, sect, step);
                }
                courierPage.updateOrderPanel();
            });

            // --- reset update
            that._resetFields(elem, inputType, $field, sect, step);
        });

        this.state = stepState;
    }

    updateValue(event, inputType, sect, step) {
        this.toggleError(event, inputType);
        this.onChangeValue(sect, step, this.isValid);
        this.isValid = null;
    }

    toggleError(event, inputType) {
        const target = event.target;
        const $targetVal = $(target).val();
        const $field = $(target).closest('.courier-form_field--outer');

        switch (inputType) {
            case 'phone':
                this.handlePhone($targetVal, $field);
                break;
            case 'name':
                this.handleName($targetVal, $field);
                break;
            case 'price':
                this.handlePrice($targetVal, $field);
                break;
            case 'address':
                this.handleAddress($targetVal, $field);
                break;
        }
    }

    handlePhone($targetVal, $field) {
        const telLength = 19;

        if ($targetVal.length !== telLength || $targetVal.indexOf('_') !== -1) {
            $field.addClass('error');
            this.isValid = false;
        } else {
            $field.removeClass('error');
            this.isValid = true;
        }
    }

    handleName($targetVal, $field) {
        const regexUkr = /^(([а-яА-ЯІіЄє',.-]+\s?){2,50})+$/;
        const regexEng = /^(([a-zA-Z',.-]+\s?){2,50})+$/;

        if (regexUkr.test($targetVal) || regexEng.test($targetVal)) {
            $field.removeClass('error');
            this.isValid = true;
        } else {
            $field.addClass('error');
            this.isValid = false;
        }
    }

    handlePrice($targetVal, $field) {
        const regex = /^[1-9]\d{0,7}$/;
        if (!regex.test($targetVal)) {
            $field.addClass('error');
            this.isValid = false;
        } else {
            $field.removeClass('error');
            this.isValid = true;
        }
    }

    handleAddress($targetVal, $field) {
        if ($field.hasClass('is-valid')) return;

        $field.addClass('error');
        this.isValid = false;
    }

    _resetFields(elem, inputType, $field, sect, step) {
        const that = this;
        const resetBtn = $(elem).siblings('.btn-field_reset');
        const submitBtn = $('.courier-form_submit');

        if (!!resetBtn.length) {

            $(resetBtn).on('click', function (event) {
                if (!$(this).siblings('input').val()) return;

                $(this).siblings('input').val('');

                if (inputType === 'address') {
                    $field.removeClass('is-valid');
                }

                that.updateValue(event, inputType, sect, step);
                that.getIsValidState();
                courierPage.updateOrderPanel();
            });
        }
    }

    onChangeValue(sectionName, key, value) {
        this.state[sectionName][key] = value;
    }

    getIsValidState() {
        let res = {
            receiver: this.isSectionValid('receiver'),
            package: this.isSectionValid('package'),
            shipper: this.isSectionValid('shipper'),
            isAllValid: null
        };
        res.isAllValid = res.receiver && res.package && res.shipper;
        return res;
    }

    isSectionValid(sectionName) {
        if (!(sectionName in this.state)) {
            throw new Error('unknown section');
        }
        const isEveryFieldValid = Object.values(this.state[sectionName]).every(this.filterInvalidCb);
        return isEveryFieldValid;
    }

    filterInvalidCb(val) {
        return val !== false;
    }

    updateAddressValidation(field) {
        const currentAddress = this.addressList.filter(elem => $(elem).data('stepsection') === field);

        const sect = $(currentAddress).data('stepsection');
        const step = $(currentAddress).data('stepkey');
        const $field = $(currentAddress).closest('.courier-form_field--outer');
        $field.removeClass('error');
        $field.addClass('is-valid');
        this.isValid = true;

        this.onChangeValue(sect, step, this.isValid);
        this.isValid = null;
        courierPage.updateOrderPanel();
    }

}

class CourierPage {
    constructor () {
        this.init = this.init.bind(this);
    }

    init() {
        this.container = document.querySelector('#courierForm');
        this._initStepSection();
    }

    _initStepSection() {
        const stepElements = Array.from(document.querySelectorAll('[data-stepsection]'));
        const selects = stepElements.filter(el => el.nodeName === "SELECT");
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-group="checkAgree"]');

        let stepState = {};

        stepElements.forEach((el) => {
            const sect = el.dataset['stepsection'];
            const step = el.dataset['stepkey'];

            if (!(sect in stepState)) {
                stepState[sect] = {};
            }

            stepState[sect][step] = null;
        });

        stepState['shipper']['shipperAddress'] = null;
        stepState['receiver']['receiverAddress'] = null;
        stepState['package']['goodsAmount'] = document.getElementById('goodsAmount').value;
        stepState['package']['deliveryDate'] = document.getElementById('deliveryDate').value;
        console.log(stepState);
        courierStepState.state = stepState;

        this.container.addEventListener("focusout", (evt) => {
            const el = evt.target;
            if (!('stepsection' in el.dataset)) {
                return false;
            }

            const sect = el.dataset['stepsection'];
            const step = el.dataset['stepkey'];
            courierStepState.onChangeValue(sect, step, el.value);
            const filledState = courierStepState.getIsFilledState();
            this.updateOrderPanel();
        });

        selects.forEach(selNode => {
            const initial_sect = selNode.dataset['stepsection'];
            const initial_step = selNode.dataset['stepkey'];
            courierStepState.onChangeValue(initial_sect, initial_step, selNode.value);

            selNode.addEventListener("change", (evt) => {
                const el = evt.target;
                const sect = el.dataset['stepsection'];
                const step = el.dataset['stepkey'];
                courierStepState.onChangeValue(sect, step, el.value);
            });
        });


        checkboxes.forEach(checkNode => {
            checkNode.addEventListener("click", (evt) => {
                const el = evt.target;

                const isChecked = $(el).is(':checked');
                const otherCheckboxes = $(checkboxes).not(el);

                otherCheckboxes.each(function (index, checkbox) {
                    $(checkbox).prop("checked", isChecked);
                });
                const sect = el.dataset['stepsection'];
                const step = el.dataset['stepkey'];
                courierStepState.onChangeValue(sect, step, el.checked);
                this.updateOrderPanel();
            });
        });
    }

    updateOrderPanel() {
        const filledState = courierStepState.getIsFilledState();
        const validState = formValidate.getIsValidState();
        const agreementState = courierStepState.isAgreementChecked();

        const panelWrapper = document.querySelector('#courierOrderWrapper');
        const courierFooter = document.querySelector('.courier-form_footer');
        const priceNodes = Array.from(document.querySelectorAll('.js-courierOrderPrice'));
        const priceInput = document.querySelector('[name="courierOrderPrice"]');
        const btnSubmitList = Array.from(document.querySelectorAll('.courier-form_submit'));


        const fromPlaceId = this.courierMap.courierMapState.senderPlaceId;
        const toPlaceId = this.courierMap.courierMapState.receiverPlaceId;

        const priceRes = this.loadPrice(this.courierMap.courierMapState.distance, fromPlaceId, toPlaceId);
        priceRes.then((res) => {
            const formatted = res.sum;

            if(res.isSuccess) {
                console.log(res);
            }

            priceNodes.forEach(function (el) {
                el.innerText = formatted;
            });

            priceInput.value = formatted;

            panelWrapper.classList.toggle("courier-aside--filled", filledState.isAllFilled && validState.isAllValid);
            courierFooter.classList.toggle("filled", filledState.isAllFilled && validState.isAllValid);


            courierStepState.requiredSections.forEach(section => {
                if (section === "agreement") return;

                const sel = '[data-stepindicator="' + section + '"]';
                const isValid = validState[section];
                const isFilled = filledState[section];
                const iconNode = panelWrapper.querySelector(sel);

                let className = 'icon ';
                if (!isValid) {
                    className += 'icon-close icon--base';
                } else if(isFilled) {
                    className += 'icon-checkmark icon--success ';
                } else if(!isFilled) {
                    className += 'icon-close icon--primary';
                }
                iconNode.className = className;
            });

            const isDisable = !filledState.isAllFilled || !validState.isAllValid || !agreementState.agreement;
            btnSubmitList.forEach(function (btnSubmit) {
                btnSubmit.classList.toggle('btn-form_disable', isDisable);
                btnSubmit.disabled = isDisable;
            });
        });
    }
}


var courierStepState = new CourierStep();
var courierPage = new CourierPage();
const formValidate = new FormValidation();

$(document).ready(function () {
    deliveryState.init();
    courierPage.init();
    formValidate.init();
});