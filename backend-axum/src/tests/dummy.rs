mod dummy_test {
    #[tokio::test]
    async fn trivial_async_test() {
        let x = 5;
        let y = async { 5 }.await;
        assert_eq!(x, y);
    }
}
