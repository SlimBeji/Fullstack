macro_rules! impl_cruds_boilerplate {
    (
        model: $model:ident,
        name: $name:literal,
        primary_key: $pk:expr,
        selectable: $selectable:ty,
        searchable: $searchable:ty,
        sortable: $sortable:ty,
        options: $options:ty,
    ) => {
        type State = AppState;
        type Entity = $model::Entity;
        type ActiveModel = $model::ActiveModel;
        type Column = $model::Column;
        type Selectable = $selectable;
        type Searchable = $searchable;
        type Sortable = $sortable;
        type Options = $options;

        fn get_base(&self) -> &Self {
            self
        }

        fn get_modelname() -> &'static str {
            $name
        }

        fn get_primary_key(&self) -> Self::Column {
            $pk
        }

        fn extract_id(value: i32) -> u32 {
            value as u32
        }
    };
}

pub(crate) use impl_cruds_boilerplate;
